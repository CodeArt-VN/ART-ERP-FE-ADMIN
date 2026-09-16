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
		component.pageConfig = { isSubActive: false } as any;
		loadDataSpy = spyOn(component, 'loadData');
		loadNodeSpy = spyOn(component, 'loadNode');
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('selectBranch should resolve selectedBranch from IDBranch and reload via loadNode only', () => {
		component.selectBranch();

		expect(component.selectedBranch).toEqual({ Id: 2, Name: 'Branch B', disabled: false });
		expect(loadNodeSpy).toHaveBeenCalled();
		expect(loadDataSpy).not.toHaveBeenCalled();
	});

	it('selectBranch should clear selectedBranch when IDBranch is empty', () => {
		component.formGroup.get('IDBranch')?.setValue(null);

		component.selectBranch();

		expect(component.selectedBranch).toBeNull();
		expect(loadNodeSpy).toHaveBeenCalled();
		expect(loadDataSpy).not.toHaveBeenCalled();
	});

	it('loadNode should call loadData once', () => {
		loadNodeSpy.and.callThrough();
		spyOn(history, 'pushState');
		component.optionGroup = [{ Code: 'POS', children: [{ Code: 'POS.A' }] }];
		component.segmentView = 'POS';
		component.selectedBranch = { Id: 2 };

		component.loadNode();

		expect(loadDataSpy).toHaveBeenCalledTimes(1);
		expect(loadDataSpy).toHaveBeenCalledWith(null);
	});
});
