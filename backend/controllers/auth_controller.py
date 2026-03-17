from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.config import settings
from auth.deps import get_current_user
from database.session import get_db
from models.user import User
from schemas.auth import LoginRequest, LogoutAllOut, LogoutOut, MoodleLoginRequest, RefreshSessionOut, RegisterRequest, TelegramLinkCodeOut, TelegramLinkRequest, TokenPair
from schemas.user import UserOut
from services.auth_service import AuthService
from services.refresh_session_service import RefreshSessionService
from services.telegram_link_service import TelegramLinkService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


def _get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip() or None
    return request.client.host if request.client else None


def _get_client_user_agent(request: Request) -> str | None:
    user_agent = request.headers.get("user-agent")
    return user_agent[:255] if user_agent else None


def _set_auth_cookies(response: Response, tokens: TokenPair) -> None:
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_access_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_refresh_expire_days * 24 * 60 * 60,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@router.post("/register", response_model=UserOut, include_in_schema=False)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService.register(db, payload)


@router.post("/login", response_model=TokenPair, include_in_schema=False)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    tokens = AuthService.login(
        db,
        payload,
        user_agent=_get_client_user_agent(request),
        ip_address=_get_client_ip(request),
    )
    _set_auth_cookies(response, tokens)
    return tokens


@router.post("/moodle/login", response_model=TokenPair)
async def moodle_login(payload: MoodleLoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    tokens = await AuthService.moodle_login(
        db,
        payload,
        user_agent=_get_client_user_agent(request),
        ip_address=_get_client_ip(request),
    )
    _set_auth_cookies(response, tokens)
    return tokens


@router.post("/refresh", response_model=TokenPair)
def refresh(
    payload: RefreshRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias="refresh_token"),
):
    refresh_token = payload.refresh_token or refresh_cookie
    if not refresh_token:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Refresh token is required")
    tokens = AuthService.refresh(
        db,
        refresh_token,
        user_agent=_get_client_user_agent(request),
        ip_address=_get_client_ip(request),
    )
    _set_auth_cookies(response, tokens)
    return tokens


@router.post("/logout", response_model=LogoutOut)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias="refresh_token"),
):
    result = AuthService.logout(db, refresh_cookie)
    _clear_auth_cookies(response)
    return result


@router.post("/logout-all", response_model=LogoutAllOut)
def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = AuthService.logout_all(db, current_user.id)
    _clear_auth_cookies(response)
    return result


@router.get("/sessions", response_model=list[RefreshSessionOut])
def sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias="refresh_token"),
):
    return RefreshSessionService.list_for_user(db, current_user.id, refresh_cookie)


@router.delete("/sessions/{session_id}", response_model=LogoutOut)
def revoke_session(
    session_id: int,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias="refresh_token"),
):
    sessions = RefreshSessionService.list_for_user(db, current_user.id, refresh_cookie)
    target = next((item for item in sessions if item.id == session_id), None)
    RefreshSessionService.revoke_by_id(db, current_user.id, session_id)
    if target and target.is_current:
        _clear_auth_cookies(response)
    return {"status": "logged_out"}


@router.post("/telegram/link")
def telegram_link(payload: TelegramLinkRequest, db: Session = Depends(get_db)):
    return AuthService.link_telegram(db, payload)


@router.post("/telegram/link-code", response_model=TelegramLinkCodeOut)
def telegram_link_code(current_user: User = Depends(get_current_user)):
    code, ttl = TelegramLinkService.create_code(current_user.id)
    return TelegramLinkCodeOut(code=code, expires_in_seconds=ttl)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
