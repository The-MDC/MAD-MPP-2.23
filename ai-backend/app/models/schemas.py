from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ConciergeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatTurn] = Field(default_factory=list)
    tone: str = Field(default="Satirical", pattern="^(Satirical|Controversial|Analytical)$")
    risk: float = Field(default=0.75, ge=0.0, le=1.0)
    regen_count: int = Field(default=0, ge=0, le=5)


class ConciergeResponse(BaseModel):
    reply: str
    tone: str
    risk: float


class SatirizeRequest(BaseModel):
    headline: str = Field(min_length=1, max_length=300)


class SatirizeResponse(BaseModel):
    original: str
    satirized: str


class ZLiarRequest(BaseModel):
    statement: str = Field(min_length=1, max_length=500)


class ZLiarResponse(BaseModel):
    bs_index: float
    verdict: str
    reasoning: str
