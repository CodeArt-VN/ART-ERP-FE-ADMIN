import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceListDetailPage } from './price-list-detail.page';

describe('PriceListDetailPage', () => {
	let component: PriceListDetailPage;
	let fixture: ComponentFixture<PriceListDetailPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [PriceListDetailPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PriceListDetailPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
