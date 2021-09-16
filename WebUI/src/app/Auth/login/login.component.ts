import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AppComponent } from '../../app.component';
import { ApiService } from '../../services/api.service';
import { AuthenticationService } from '../../services/authentication.service'; 
declare var $: any;

export class LoginModel {
  phoneNumber: string;
  otp: number;
  email: string;
  password: any;
  isPasswordLogin: boolean;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginModel]
})
export class LoginComponent implements OnInit {

  constructor(private route: ActivatedRoute,
    private router: Router,
    private _apiService: ApiService,
    private _appComponent: AppComponent,
    private _authService: AuthenticationService,
    public loginModel: LoginModel) { }

  counter: string;
  loading: boolean = false;
  isVisible: boolean = false;
  otpSenderText: string = "Send OTP";
  returnUrl: string;
  responseMessage: string;
  hasMessage: boolean;
  isSuccess: boolean;
  resendButtonDisabled: boolean = false;
  isSubmitted: boolean = false;
  signInloading: boolean = false;
  signInEnabled: boolean = false;
  isPasswordLogin: boolean = false;
  isEmailBoxDisabled: boolean = false;
  isPasswordBoxDisabled: boolean = false;
  isPhoneNumberDisabled: boolean = false;

  ngOnInit() {
    this._appComponent.isLoginPage = true;
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/'; 
    this.loginModel.isPasswordLogin = false;
    $('.content-wrapper').css("margin-left", "0");
  }

  sendOTP() {
    var authSession = sessionStorage.getItem("_AuthStore");
    if (authSession != null)
      sessionStorage.removeItem("_AuthStore");

    this.counter = null;
    if (this.loginModel.phoneNumber == null) {
      $("#phoneNumber").focus();
      return false;
    }
    var phonePattern = /([0-9]{10})|(\([0-9]{3}\)\s+[0-9]{3}\-[0-9]{4})/;
    if (!phonePattern.test(this.loginModel.phoneNumber)) {
      this.responseMessage ="Provide a Valid Phone Number to continue"
      this.hasMessage = true;
      this.isSuccess = false;
      return false;
    }
    else {
      this.hasMessage = false;
      this.isSuccess = false;
    }
    this.loading = true;
    this.resendButtonDisabled = true;
    this._apiService.sendOTP(this.loginModel.phoneNumber).subscribe((res: any) => {
      this.loading = false;
      this.otpSenderText = "Resend OTP";

      if (res.isSuccessful) {
        this.isVisible = true;
        sessionStorage.setItem("_AuthStore", res.extras._session);
        this.isSuccess = true;
        this.hasMessage = true;
        $('#timer').fadeIn();
        this.timer(60);
        this.responseMessage = "Enter the OTP you've received.";
        this.signInEnabled = false; 
        this.resendButtonDisabled = false;
      }
      else {
        $('#timer').fadeOut();
        this.isVisible = false;
        this.isSuccess = false;
        this.hasMessage = true;
        this.loading = false;
        this.resendButtonDisabled = false;
        this.signInEnabled = true;
        this.responseMessage = res.message;
      }
    }, error => {
      this.loading = false;
      this.responseMessage = error;
      this.resendButtonDisabled = false;
      this.isSuccess = false;
      this.hasMessage = true;
      this.signInEnabled = true;
    });

  }

  verifyOTP() {
    this.signInloading = true;
    this.signInEnabled = true;
    this.isSubmitted = true;
    this._authService.login(this.loginModel)
      .pipe(first())
      .subscribe(
        data => { 
          this.signInloading = false;
          this.signInEnabled = false;
          if (data.result.error) {
            this.responseMessage = data.result.message;
            this.hasMessage = true;
            this.isSuccess = false;
            this.isSubmitted = false;
          }
          else {
            this.isSubmitted = false;
            this.signInEnabled = false;
            $('#timer').fadeOut();
            window.location.href = this.returnUrl; 
          }

        },
        error => {

          this.hasMessage = true;
          this.isSuccess = false;
          this.signInEnabled = false;
          this.signInloading = false;
          this.responseMessage = error.message == undefined ? "Could not connect to server. Try again later." : error.message;
          this.loading = false;
        });
  }

  setOTPLoginType() { 
    if (this.loginModel.phoneNumber != "") {
      this.isEmailBoxDisabled = true;
      this.isPasswordBoxDisabled = true;
      this.isPhoneNumberDisabled = false;
      this.loginModel.isPasswordLogin = false;
    }
    else {
      this.isPhoneNumberDisabled = false;
      this.isEmailBoxDisabled = false;
      this.isPasswordBoxDisabled = false;
      this.loginModel.isPasswordLogin = false;
    }

  }

  setPasswordLoginType() {

    if (this.loginModel.email != "") {
      this.isPhoneNumberDisabled = true;
      this.loginModel.isPasswordLogin = true;
    }
    else {
      this.isEmailBoxDisabled = false;
      this.isPasswordBoxDisabled = false;
      this.isPhoneNumberDisabled = false;
      this.loginModel.isPasswordLogin = false;
    }
  }

  timerCallBack(remaining: number) {
    this.timer(remaining);
  }
  timerOn: boolean = false;
  timer(remaining: number) {
    var m: any = Math.floor(remaining / 60);
    var s: any = remaining % 60;

    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;
    this.counter = m + ':' + s;
    this.timerOn = true;
    remaining -= 1;
    let $this = this;
    if (remaining >= 0 && this.timerOn) {
      setTimeout(function () {
        $this.timerCallBack(remaining);
      }, 1000);
      return;
    }
    else {
      this.counter = null;
      this.resendButtonDisabled = false;
      $('#timer').fadeOut();
    }
    if (!this.timerOn) {
      $('#timer').fadeOut();
      return;
    }

  }
}
