import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PriceListPage } from './price-list.page';

describe('PriceListPage', () => {
	let component: PriceListPage;
	let fixture: ComponentFixture<PriceListPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [PriceListPage],
			imports: [IonicModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(PriceListPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
