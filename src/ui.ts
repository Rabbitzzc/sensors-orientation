import { installDragHandle } from './drag';
import { DeviceOrientation } from './emulation';
import { EulerAngles, Vector, calculateAngle, crossProduct } from './geometry';
import { CustomElement, consume, createElement } from './utils';

const enum DeviceOrientationModificationSource {
	UserInput = 'userInput',
	UserDrag = 'userDrag',
	ResetButton = 'resetButton',
	SelectPreset = 'selectPreset',
}

const ShiftDragOrientationSpeed = 16;

export class OrientationView {
	private boxElement: CustomElement;
	private orientationLayer: CustomElement;
	private orientationContent: CustomElement;
	private stageElement: CustomElement;
	private deviceOrientationOverrideEnabled = true;
	private boxMatrix?: DOMMatrix;
	private mouseDownVector?: Vector | null;
	private originalBoxMatrix?: DOMMatrix;
	private deviceOrientation: DeviceOrientation;

	constructor(private orientationGroup: HTMLElement) {}

	private onBoxDragStart(event: MouseEvent): boolean {
		if (!this.deviceOrientationOverrideEnabled) {
			return false;
		}

		this.mouseDownVector = this.calculateRadiusVector(event.x, event.y);
		this.originalBoxMatrix = this.boxMatrix;

		if (!this.mouseDownVector) {
			return false;
		}

		consume(event, true);
		return true;
	}

	private calculateRadiusVector(x: number, y: number): Vector | null {
		const rect = this.stageElement.getBoundingClientRect();
		const radius = Math.max(rect.width, rect.height) / 2;
		const sphereX = (x - rect.left - rect.width / 2) / radius;
		const sphereY = (y - rect.top - rect.height / 2) / radius;
		const sqrSum = sphereX * sphereX + sphereY * sphereY;
		if (sqrSum > 0.5) {
			return new Vector(sphereX, sphereY, 0.5 / Math.sqrt(sqrSum));
		}

		return new Vector(sphereX, sphereY, Math.sqrt(1 - sqrSum));
	}

	private onBoxDrag(event: MouseEvent): boolean {
		const mouseMoveVector = this.calculateRadiusVector(event.x, event.y);
		if (!mouseMoveVector) {
			return true;
		}

		if (!this.mouseDownVector) {
			return true;
		}

		consume(event, true);
		let axis, angle;
		if (event.shiftKey) {
			axis = new Vector(0, 0, 1);
			angle =
				(mouseMoveVector.x - this.mouseDownVector.x) *
				ShiftDragOrientationSpeed;
		} else {
			axis = crossProduct(this.mouseDownVector, mouseMoveVector);
			angle = calculateAngle(this.mouseDownVector, mouseMoveVector);
		}

		const currentMatrix = new DOMMatrixReadOnly()
			.rotateAxisAngle(-axis.x, axis.z, axis.y, angle)
			.multiply(this.originalBoxMatrix);

		const eulerAngles =
			EulerAngles.fromDeviceOrientationRotationMatrix(currentMatrix);
		const newOrientation = new DeviceOrientation(
			eulerAngles.alpha,
			eulerAngles.beta,
			eulerAngles.gamma
		);
		this.setDeviceOrientation(
			newOrientation,
			DeviceOrientationModificationSource.UserDrag
		);
		// this.setSelectElementLabel(
		// 	this.orientationSelectElement,
		// 	NonPresetOptions.Custom
		// );
		return false;
	}

	private resetDeviceOrientation(): void {
		this.setDeviceOrientation(
			new DeviceOrientation(0, 90, 0),
			DeviceOrientationModificationSource.ResetButton
		);
		// this.setSelectElementLabel(this.orientationSelectElement, '[0, 90, 0]');
	}

	private setDeviceOrientation(
		deviceOrientation: DeviceOrientation | null,
		modificationSource: DeviceOrientationModificationSource
	): void {
		if (!deviceOrientation) {
			return;
		}

		function roundAngle(angle: number): number {
			return Math.round(angle * 10000) / 10000;
		}

		const alpha = String(roundAngle(deviceOrientation.alpha));
		const beta = String(roundAngle(deviceOrientation.beta));
		const gamma = String(roundAngle(deviceOrientation.gamma));

		console.error('偏移量数据为：', alpha, beta, gamma);
		// TODO 应该是将信息输入到输入框中....
		// if (modificationSource !== DeviceOrientationModificationSource.UserInput) {
		// 	this.alphaSetter(String(roundAngle(deviceOrientation.alpha)));
		// 	this.betaSetter(String(roundAngle(deviceOrientation.beta)));
		// 	this.gammaSetter(String(roundAngle(deviceOrientation.gamma)));
		// }

		const animate =
			modificationSource !== DeviceOrientationModificationSource.UserDrag;
		this.setBoxOrientation(deviceOrientation, animate);

		this.deviceOrientation = deviceOrientation;
		this.applyDeviceOrientation();
	}

	private applyDeviceOrientation(): void {
		if (this.deviceOrientationOverrideEnabled) {
			// TODO：this.deviceOrientationSetting.set(this.deviceOrientation.toSetting()); 了解含义
		}
		// TODO 含义
		// for (const emulationModel of SDK.TargetManager.TargetManager.instance().models(
		// 	SDK.EmulationModel.EmulationModel
		// )) {
		// 	void emulationModel.emulateDeviceOrientation(
		// 		this.deviceOrientationOverrideEnabled ? this.deviceOrientation : null
		// 	);
		// }
	}

	private setBoxOrientation(
		deviceOrientation: DeviceOrientation,
		animate: boolean
	): void {
		if (animate) {
			this.stageElement.classList.add('is-animating');
		} else {
			this.stageElement.classList.remove('is-animating');
		}

		const { alpha, beta, gamma } = deviceOrientation;
		this.boxMatrix = new DOMMatrixReadOnly()
			.rotate(0, 0, alpha)
			.rotate(beta, 0, 0)
			.rotate(0, gamma, 0);
		this.orientationLayer.style.transform = `rotateY(${alpha}deg) rotateX(${-beta}deg) rotateZ(${gamma}deg)`;
	}

	/**
	 * TODO: 选择器：这里是给 select 增加内容，似乎没必要
	 */
	private setSelectElementLabel(
		selectElement: HTMLSelectElement,
		labelValue: string
	): void {
		const optionValues = Array.prototype.map.call(
			selectElement.options,
			(x) => x.value
		);
		selectElement.selectedIndex = optionValues.indexOf(labelValue);
	}

	private loadingDeviceEmulation() {
		this.orientationContent = createElement('div', 'orientation-content');
		this.stageElement = this.orientationContent.createChild(
			'div',
			'orientation-stage'
		);
		this.orientationLayer = this.stageElement.createChild(
			'div',
			'orientation-layer'
		);
		this.boxElement = this.orientationLayer.createChild(
			'section',
			'orientation-box orientation-element'
		);
		this.boxElement.createChild(
			'section',
			'orientation-front orientation-element'
		);
		this.boxElement.createChild(
			'section',
			'orientation-top orientation-element'
		);
		this.boxElement.createChild(
			'section',
			'orientation-back orientation-element'
		);
		this.boxElement.createChild(
			'section',
			'orientation-left orientation-element'
		);
		this.boxElement.createChild(
			'section',
			'orientation-right orientation-element'
		);
		this.boxElement.createChild(
			'section',
			'orientation-bottom orientation-element'
		);
		this.orientationGroup.appendChild(this.orientationContent);
	}

	createDeviceOrientation() {
		this.loadingDeviceEmulation();

		installDragHandle(
			this.stageElement,
			this.onBoxDragStart.bind(this),
			(event) => {
				this.onBoxDrag(event);
			},
			null,
			'-webkit-grabbing',
			'-webkit-grab'
		);
	}
}
