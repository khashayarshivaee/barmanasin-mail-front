import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinnedListComponent } from './pinned-list.component';

describe('PinnedListComponent', () => {
  let component: PinnedListComponent;
  let fixture: ComponentFixture<PinnedListComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PinnedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
