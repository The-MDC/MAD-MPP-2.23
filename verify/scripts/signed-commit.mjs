#!/usr/bin/env node
/**
 * Commit files to a branch THROUGH THE GITHUB API, so the commit is signed by GitHub.
 *
 * Why: Vercel blocks deployments of unsigned commits on this project ("Deployment was blocked"), and a plain
 * `git commit && git push` from a local machine is unsigned. A commit made through GraphQL `createCommitOnBranch`
 * is signed by GitHub (committer `GitHub`, verification `valid`), and builds normally. It also never rewrites
 * history: it adds a commit on top of the branch's current head, so there is no force-push.
 *
 * Usage (from anywhere inside the checkout; paths are relative to the repo root or the current directory):
 *   node verify/scripts/signed-commit.mjs --branch <name> --message "<headline>" [--body "<text>"] \
 *        [--delete <path>]... [--allow-empty] <file>...
 *
 *   --allow-empty   commit with no file changes (re-signs the head after an unsigned push)
 *
 * It sends the CURRENT CONTENT of each file (binary-safe, base64) on top of the remote head of --branch, then
 * prints the new commit and whether GitHub reports it verified. Afterwards bring your checkout level with:
 *   git fetch origin <branch> && git merge --ff-only origin/<branch>
 * (if the files you committed are still modified locally, run `git checkout -- <file>` first).
 *
 * Needs the GitHub CLI (`gh`), already logged in.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const opts = { branch: "", message: "", body: "", repo: "", deletes: [], files: [], allowEmpty: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--branch") opts.branch = args[++i] ?? "";
  else if (a === "--message") opts.message = args[++i] ?? "";
  else if (a === "--body") opts.body = args[++i] ?? "";
  else if (a === "--repo") opts.repo = args[++i] ?? "";
  else if (a === "--delete") opts.deletes.push(args[++i] ?? "");
  else if (a === "--allow-empty") opts.allowEmpty = true;
  else if (a.startsWith("--")) fail(`unknown option ${a}`);
  else opts.files.push(a);
}

if (!opts.branch) fail("--branch is required");
if (!opts.message.trim()) fail("--message is required");
if (/^(main|master)$/.test(opts.branch)) fail("refusing to commit straight to main; open a PR from a branch");
if (opts.files.length === 0 && opts.deletes.length === 0 && !opts.allowEmpty) {
  fail("no files given (pass files, --delete, or --allow-empty to re-sign the head)");
}

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const gh = (a, input) => execFileSync("gh", a, { encoding: "utf8", input });

const top = git("rev-parse", "--show-toplevel");
const repo =
  opts.repo ||
  (git("remote", "get-url", "origin").match(/github\.com[:/](.+?)(?:\.git)?$/) ?? [])[1] ||
  fail("could not work out owner/name from the origin remote; pass --repo");

const toRepoPath = (p) => path.relative(top, path.resolve(p)).split(path.sep).join("/");
/**
 * The bytes to commit for one file. On Windows, `core.autocrlf=true` leaves CRLF on disk while the repository stores LF;
 * committing the disk bytes through the API would then rewrite EVERY line of an edited file (a 3-line change showing as
 * +1587/-1557, found on PR #224). So a text file with CRLF is sent as LF unless origin/main stores that same path with
 * CRLF. Binary files (any NUL byte) and files with no CRLF are sent exactly as they are.
 */
function bytesFor(f) {
  const raw = readFileSync(f);
  if (raw.includes(0) || !raw.includes("\r\n")) return raw;
  let mainHasCrlf = false;
  try {
    mainHasCrlf = execFileSync("git", ["show", `origin/main:${toRepoPath(f)}`], { maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).includes("\r\n");
  } catch {
    mainHasCrlf = false; // not on main (a new file), or no origin/main: LF
  }
  if (mainHasCrlf) return raw;
  return Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
}

const additions = opts.files.map((f) => ({ path: toRepoPath(f), contents: bytesFor(f).toString("base64") }));
const deletions = opts.deletes.map((p) => ({ path: toRepoPath(p) }));
for (const x of [...additions, ...deletions]) if (x.path.startsWith("..")) fail(`${x.path} is outside the repository`);

const head = git("ls-remote", "origin", `refs/heads/${opts.branch}`).split(/\s+/)[0];
if (!head) fail(`branch ${opts.branch} does not exist on origin`);

const query = "mutation($input: CreateCommitOnBranchInput!){ createCommitOnBranch(input:$input){ commit{ oid url } } }";
const input = {
  branch: { repositoryNameWithOwner: repo, branchName: opts.branch },
  message: { headline: opts.message, ...(opts.body ? { body: opts.body } : {}) },
  expectedHeadOid: head,
  fileChanges: { additions, deletions },
};
const res = JSON.parse(gh(["api", "graphql", "--input", "-"], JSON.stringify({ query, variables: { input } })));
const oid = res?.data?.createCommitOnBranch?.commit?.oid;
if (!oid) fail(`GitHub did not create the commit: ${JSON.stringify(res).slice(0, 300)}`);

const v = JSON.parse(gh(["api", `repos/${repo}/commits/${oid}`]));
const ok = v.commit?.verification?.verified === true;
console.log(`${ok ? "✔" : "✖"} ${oid.slice(0, 9)} on ${opts.branch}: committer=${v.commit?.committer?.name}, verified=${ok} (${v.commit?.verification?.reason})`);
console.log(`  ${additions.length} file(s) added/changed, ${deletions.length} deleted`);
console.log(`Bring your checkout level:  git fetch origin ${opts.branch} && git merge --ff-only origin/${opts.branch}`);
process.exit(ok ? 0 : 2);
