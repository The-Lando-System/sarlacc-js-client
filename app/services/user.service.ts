import { Injectable, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { CookieService } from 'angular2-cookie/services/cookies.service';

import { Broadcaster } from './broadcaster';
import { User } from './user';
import { Token } from './token';

@Injectable()
export class UserService {

  //private tokenUrl = 'http://localhost:8080/oauth/token';
  //private userUrl = 'http://localhost:8080/user-details';
  private tokenUrl = 'https://sarlacc.herokuapp.com/oauth/token';
  private userUrl = 'https://sarlacc.herokuapp.com/user-details';

  private token: Token;
  private user: User;

  private initPromise: Promise<any> = this.initialize();
  
  constructor(
    private http: Http,
    private cookieService: CookieService,
    private broadcaster: Broadcaster
  ){}

  initialize(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("UserSvc Init - Initializing user and token");
      this.token = this.getTokenFromCookie();
      if (this.token) {
        console.log("UserSvc Init - Found a token in the cookies. Retrieving the user");
        this.retrieveUser(this.token)
        .then((user:User) => {
          this.user = user;
          console.log("UserSvc Init - Found a user. Both user and token are initialized");
          resolve();
        }).catch((error:any) => {
          console.log("UserSvc Init - Failed to retrieve the user. Error below");
          console.log(error);
          reject();
        });
      } else {
        console.log("UserSvc Init - No token detected. Both user and token are null. User needs to login");
        reject();
      }
    });
  }

  checkIfUserIsLoggedIn(): Promise<any> {
    return this.initPromise;
  }

  getAuthHeaders(): Headers {
    return new Headers({
      'Content-Type'   : 'application/json',
      'x-access-token'  : this.getToken().access_token
    });
  }

  login(creds: any): Promise<User> {
    console.log("login - logging in with username " + creds.username + " and password " + creds.password);
    return this.retrieveToken(creds)
    .then((token:Token) => {
      this.putTokenInCookie(token);
      this.token = token;
      console.log("login - successfully got token and put it in the cookies");
      return this.retrieveUser(token)
      .then((user:User) => {
        this.user = user;
        console.log("login - successfully got user");
        this.broadcaster.broadcast('Login','The user logged in');
        return user;
      }).catch((error:any) => {
        console.log("login - error retrieving the user. Details below:");
        console.log(error);
      });
    }).catch((error:any) => {
      console.log("login - Error retrieving the token. Details below:");
      console.log(error);
    });
  }

  getUser(): User {
    return this.user;
  }

  getToken(): Token {
    return this.token;
  }

  retrieveUser(token:Token): Promise<User> {
    return this.http.post(this.userUrl, {}, {headers: this.getUserHeaders(token.access_token)})
      .toPromise()
      .then((res:any) => {
        return res.json();
      }).catch((res:any) => {
        return res.json();
      });
  }

  retrieveToken(creds:any): Promise<Token> {

    creds.grant_type = 'password';
    let body = `username=${creds.username}&password=${creds.password}&grant_type=${creds.grant_type}`;

    return this.http.post(this.tokenUrl, body, {headers: this.getTokenHeaders()})
    .toPromise()
    .then((res:any) => {
      return res.json();
    }).catch((res:any) => {
      return res.json();
    });
  }

  putTokenInCookie(token:Token): void {
    this.cookieService.put('access-token',token.access_token);
  }

  getTokenFromCookie(): Token {
    var access_token = this.cookieService.get('access-token');
    if (access_token) {
      var token: Token = new Token();
      token.access_token = access_token;
      return token;
    } else {
      return null;
    }
  }

  removeTokenFromCookie(): void {
    this.cookieService.remove('access-token');
  }

  getTokenHeaders(): Headers {
    return new Headers({
      'Content-Type'   : 'application/x-www-form-urlencoded',
      'Authorization'  : 'Basic ' + btoa('sarlacc:deywannawanga')
    });
  }

  getUserHeaders(token:string): Headers {
    return new Headers({
      'Authorization'  : 'Bearer ' + token
    });
  }

}