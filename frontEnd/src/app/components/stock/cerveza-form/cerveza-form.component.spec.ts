import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CervezaFormComponent } from './cerveza-form.component';

describe('CervezaFormComponent', () => {
  let component: CervezaFormComponent;
  let fixture: ComponentFixture<CervezaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CervezaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CervezaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
