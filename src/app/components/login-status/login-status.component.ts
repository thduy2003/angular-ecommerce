import { OktaAuth } from '@okta/okta-auth-js';
import { Component, Inject, OnInit } from '@angular/core';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';

@Component({
  selector: 'app-login-status',
  templateUrl: './login-status.component.html',
  styleUrls: ['./login-status.component.css'],
})
export class LoginStatusComponent implements OnInit {
  isAuthenticated: boolean = false;
  userFullName: string = '';
  storage: Storage = sessionStorage;
  constructor(
    private oktaAuthService: OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth,
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state changes
    this.oktaAuthService.authState$.subscribe((result) => {
      this.isAuthenticated = result.isAuthenticated!;
      this.getUserDetails();
    });
  }
  getUserDetails() {
    if (this.isAuthenticated) {
      //Fetch the logged in user details(user's claims)
      //user fullname is exposed as a property name
      this.oktaAuth.getUser().then((res) => {
        this.userFullName = res.name as string;
        //retrieve the user's email from authentiicatioin response
        const theEmail = res.email as string;
        //now store the email in browser storage
        this.storage.setItem('userEmail', JSON.stringify(theEmail));
      });
    }
  }
  logout() {
    // terminates the session with Okta and removes current tokens
    this.oktaAuth.signOut();
  }
}
