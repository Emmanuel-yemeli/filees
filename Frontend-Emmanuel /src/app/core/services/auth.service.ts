import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  AuthResponse, LoginRequest, RegisterRequest,
  User, UserRole, UserType, UserStatus, SubscriptionType
} from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL  = `${environment.userApiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY  = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => this.setSession(response))
    );
  }

  registerClient(data: RegisterRequest): Observable<AuthResponse> {
    return this.register({ ...data, role: UserRole.CLIENT, type: UserType.CLIENT });
  }

  registerFreelancer(data: RegisterRequest): Observable<AuthResponse> {
    return this.register({ ...data, role: UserRole.FREELANCER, type: UserType.FREELANCE });
  }

  registerAdmin(data: RegisterRequest): Observable<AuthResponse> {
    return this.register({ ...data, role: UserRole.ADMIN, type: UserType.ADMIN });
  }

  private register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(response => this.setSession(response))
    );
  }

  private setSession(authResult: AuthResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, authResult.token);

      const backendRole = (authResult.role || authResult.type) as string;
      const normalizedRole = backendRole?.toUpperCase();

      let userRole: UserRole;
      if (normalizedRole === 'CLIENT') {
        userRole = UserRole.CLIENT;
      } else if (normalizedRole === 'FREELANCE' || normalizedRole === 'FREELANCER') {
        userRole = UserRole.FREELANCER;
      } else if (normalizedRole === 'ADMIN') {
        userRole = UserRole.ADMIN;
      } else if (normalizedRole === 'SUPPORT_AGENT') {
        userRole = UserRole.SUPPORT_AGENT;   // ← NOUVEAU
      } else {
        userRole = backendRole as UserRole;
      }

      const user: User = {
        id: authResult.userId,
        email: authResult.email,
        firstName: authResult.firstName,
        lastName: authResult.lastName,
        role: userRole,
        type: userRole === UserRole.CLIENT          ? UserType.CLIENT
            : userRole === UserRole.FREELANCER       ? UserType.FREELANCE
            : userRole === UserRole.SUPPORT_AGENT    ? UserType.SUPPORT_AGENT
            : UserType.ADMIN,
        status: authResult.status as any,
        subscriptionType: SubscriptionType.FREE,
        emailVerified: authResult.emailVerified,
        avatar: authResult.avatar,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  /** Redirection après login selon le rôle */
  redirectAfterLogin(role: UserRole): void {
    const normalizedRole = role.toString().toUpperCase();

    if (normalizedRole === 'CLIENT') {
      this.router.navigate(['/frontoffice/client/dashboard']);
    } else if (normalizedRole === 'FREELANCE' || normalizedRole === 'FREELANCER') {
      this.router.navigate(['/frontoffice/freelancer/dashboard']);
    } else if (normalizedRole === 'ADMIN') {
      this.router.navigate(['/backoffice/admin/dashboard']);
    } else if (normalizedRole === 'SUPPORT_AGENT') {
      this.router.navigate(['/backoffice/agent/queue']);   // ← NOUVEAU
    } else {
      this.router.navigate(['/landing']);
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean { return this.getToken() !== null; }

  getToken(): string | null {
    if (typeof window !== 'undefined') return localStorage.getItem(this.TOKEN_KEY);
    return null;
  }

  getCurrentUser(): User | null { return this.currentUserSubject.value; }

  hasRole(role: UserRole): boolean { return this.getCurrentUser()?.role === role; }

  isAdmin(): boolean         { return this.hasRole(UserRole.ADMIN); }
  isClient(): boolean        { return this.hasRole(UserRole.CLIENT); }
  isFreelancer(): boolean    { return this.hasRole(UserRole.FREELANCER); }
  isSupportAgent(): boolean  { return this.hasRole(UserRole.SUPPORT_AGENT); }  // ← NOUVEAU

  updateUserSession(user: User): void {
    const token = localStorage.getItem(this.TOKEN_KEY) || '';
    this.setSession({
      token,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      type: user.type,
      status: user.status as any,
      emailVerified: user.emailVerified || false,
      avatar: user.avatar
    });
  }
}