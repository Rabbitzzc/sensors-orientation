import { installDragHandle } from './drag';
import { DeviceOrientation } from './emulation';
import { EulerAngles, Vector, calculateAngle, crossProduct } from './geometry';
import { CustomElement, consume, createElement, roundAngle } from './utils';

const enum DeviceOrientationModificationSource {
	UserInput = 'userInput',
	UserDrag = 'userDrag',
	ResetButton = 'resetButton',
	SelectPreset = 'selectPreset',
}

const ShiftDragOrientationSpeed = 16;

type ChangedFCType = (orientation: {
	alpha: number;
	beta: number;
	gamma: number;
}) => any;

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
	private deviceOrientationChanged: ChangedFCType;

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
		return false;
	}

	private setDeviceOrientation(
		deviceOrientation: DeviceOrientation | null,
		modificationSource: DeviceOrientationModificationSource
	): void {
		if (!deviceOrientation) {
			return;
		}

		const animate =
			modificationSource !== DeviceOrientationModificationSource.UserDrag;
		this.setBoxOrientation(deviceOrientation, animate);

		this.deviceOrientation = deviceOrientation;

		const alpha = Number(roundAngle(deviceOrientation.alpha));
		const beta = Number(roundAngle(deviceOrientation.beta));
		const gamma = Number(roundAngle(deviceOrientation.gamma));
		this.deviceOrientationChanged({
			alpha,
			beta,
			gamma,
		});
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

	/**
	 * 重置数据
	 */
	resetDeviceOrientation(): void {
		this.setDeviceOrientation(
			new DeviceOrientation(0, 90, 0),
			DeviceOrientationModificationSource.ResetButton
		);
	}

	/**
	 * 注册 DOM
	 */
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

	onChangeDeviceOrientation(cb: ChangedFCType) {
		this.deviceOrientationChanged = cb;
	}
}
