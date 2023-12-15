import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RosterComponent } from './roster.component';
import { RosterService } from './roster.service'; // Adjust the path as necessary

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [
    RosterComponent
  ],
  providers: [
    RosterService
  ]
})
export class RosterModule {}

