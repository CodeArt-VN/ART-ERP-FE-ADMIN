import { FormBuilder } from '@angular/forms';
import { ConfigPage } from './config.page';

describe('ConfigPage', () => {
	let component: ConfigPage;
	let loadDataSpy: jasmine.Spy;
	let loadNodeSpy: jasmine.Spy;

	beforeEach(() => {
		component = Object.create(ConfigPage.prototype) as ConfigPage;
		component.branchList = [
			{ Id: 1, Name: 'Company A', disabled: false },
			{ Id: 2, Name: 'Branch B', disabled: false },
		];
		component.formGroup = new FormBuilder().group({
			IDBranch: [2],
		});
		component.selectedBranch = null;
		loadDataSpy = spyOn(component, 'loadData');
		loadNodeSpy = spyOn(component, 'loadNode');
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('selectBranch should resolve selectedBranch from IDBranch', () => {
		component.selectBranch();

		expect(component.selectedBranch).toEqual({ Id: 2, Name: 'Branch B', disabled: false });
		expect(loadDataSpy).toHaveBeenCalledWith(null);
		expect(loadNodeSpy).toHaveBeenCalled();
	});

	it('selectBranch should clear selectedBranch when IDBranch is empty', () => {
		component.formGroup.get('IDBranch')?.setValue(null);

		component.selectBranch();

		expect(component.selectedBranch).toBeNull();
		expect(loadDataSpy).toHaveBeenCalledWith(null);
		expect(loadNodeSpy).toHaveBeenCalled();
	});
});
