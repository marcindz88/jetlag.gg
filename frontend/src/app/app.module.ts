import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AuthModule } from '@auth/auth.module';
import { authInterceptorProvider } from '@auth/services/auth-interceptor.service';
import { preflightInterceptorProvider } from '@shared/services/preflight-interceptor.service';
import { SharedModule } from '@shared/shared.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    SharedModule,
    AuthModule,
  ],
  bootstrap: [AppComponent],
  providers: [authInterceptorProvider, preflightInterceptorProvider],
})
export class AppModule {}
