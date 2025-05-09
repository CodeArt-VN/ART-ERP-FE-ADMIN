import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HelpPage } from './help.page';

describe('FormPage', () => {
	let component: HelpPage;
	let fixture: ComponentFixture<HelpPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [HelpPage],
			imports: [IonicModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(HelpPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
