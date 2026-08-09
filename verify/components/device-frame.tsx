"use client";

/**
 * MAD Gambit — DeviceFrame
 * ------------------------------------------------------------------
 * One responsive presentation shell for the whole dApp. Renders its
 * children exactly once; all responsive behaviour is CSS-only (see the
 * .mg-workbench / .mg-device rules in globals.css):
 *
 *   Mobile  (< md)  — full-bleed, no frame. Native app feel.
 *   Tablet  (md)    — centered card with gutters on a dark field.
 *   Desktop (lg+)   — sleek phone bezel sitting on a dark "workbench".
 *
 * On desktop the .mg-device has a `transform`, which makes it the
 * containing block for `position: fixed` descendants — so the app's
 * bottom-nav and concierge anchor to the PHONE, not the browser window,
 * completing the device illusion without touching those components.
 */

import React from "react";

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mg-workbench">
      <div className="mg-device">{children}</div>
    </div>
  );
}
