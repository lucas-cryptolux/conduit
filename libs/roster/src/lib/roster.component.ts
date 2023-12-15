import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RosterService } from './roster.service';

@Component({
  selector: 'realworld-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class RosterComponent implements OnInit {
  roster: any[] = [];

  constructor(
    private rosterService: RosterService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.rosterService.getRoster().subscribe(data => {
      this.roster = data;
      this.changeDetectorRef.detectChanges();
    });
  }
}

