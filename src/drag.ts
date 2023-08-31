import { platform } from './utils';

/**
 * 注册拖动能力
 */
export function installDragHandle(
	element: Element,
	elementDragStart: ((arg0: MouseEvent) => boolean) | null,
	elementDrag: (arg0: MouseEvent) => void,
	elementDragEnd: ((arg0: MouseEvent) => void) | null,
	cursor: string | null,
	hoverCursor?: string | null,
	startDelay?: number
): void {
	function onMouseDown(event: Event): void {
		const dragHandler = new DragHandler();
		const dragStart = (): void =>
			dragHandler.elementDragStart(
				element,
				elementDragStart,
				elementDrag,
				elementDragEnd,
				cursor,
				event
			);
		if (startDelay) {
			startTimer = window.setTimeout(dragStart, startDelay);
		} else {
			dragStart();
		}
	}

	function onMouseUp(): void {
		if (startTimer) {
			window.clearTimeout(startTimer);
		}
		startTimer = null;
	}

	let startTimer: number | null;
	element.addEventListener('pointerdown', onMouseDown, false);
	if (startDelay) {
		element.addEventListener('pointerup', onMouseUp, false);
	}
	if (hoverCursor !== null) {
		(element as HTMLElement).style.cursor = hoverCursor || cursor || '';
	}
}

/**
 * 增加 element dragstart
 */
class DragHandler {
	private elementDraggingEventListener?: (arg0: MouseEvent) => void | boolean;
	private elementEndDraggingEventListener?: ((arg0: MouseEvent) => void) | null;
	private dragEventsTargetDocument?: Document;
	private dragEventsTargetDocumentTop?: Document;
	private restoreCursorAfterDrag?: () => void;

	constructor() {
		this.elementDragMove = this.elementDragMove.bind(this);
		this.elementDragEnd = this.elementDragEnd.bind(this);
		this.mouseOutWhileDragging = this.mouseOutWhileDragging.bind(this);
	}

	private disposeGlassPane(): void {
		DragHandler.documentForMouseOut = null;
		DragHandler.rootForMouseOut = null;
	}

	elementDragStart(
		targetElement: Element,
		elementDragStart: ((arg0: MouseEvent) => boolean) | null,
		elementDrag: (arg0: MouseEvent) => void | boolean,
		elementDragEnd: ((arg0: MouseEvent) => void) | null,
		cursor: string | null,
		ev: Event
	): void {
		const event = ev as MouseEvent;
		// Only drag upon left button. Right will likely cause a context menu. So will ctrl-click on mac.
		if (event.button || (platform() === 'mac' && event.ctrlKey)) {
			return;
		}

		if (this.elementDraggingEventListener) {
			return;
		}

		if (elementDragStart && !elementDragStart(event as MouseEvent)) {
			return;
		}

		const targetDocument = (event.target instanceof Node &&
			event.target.ownerDocument) as Document;
		this.elementDraggingEventListener = elementDrag;
		this.elementEndDraggingEventListener = elementDragEnd;
		console.assert(
			(DragHandler.documentForMouseOut || targetDocument) === targetDocument,
			'Dragging on multiple documents.'
		);
		DragHandler.documentForMouseOut = targetDocument;
		DragHandler.rootForMouseOut =
			(event.target instanceof Node && event.target.getRootNode()) || null;
		this.dragEventsTargetDocument = targetDocument;
		try {
			if (targetDocument.defaultView && targetDocument.defaultView.top) {
				this.dragEventsTargetDocumentTop =
					targetDocument.defaultView.top.document;
			}
		} catch (e) {
			this.dragEventsTargetDocumentTop = this.dragEventsTargetDocument;
		}

		targetDocument.addEventListener('pointermove', this.elementDragMove, true);
		targetDocument.addEventListener('pointerup', this.elementDragEnd, true);
		DragHandler.rootForMouseOut &&
			DragHandler.rootForMouseOut.addEventListener(
				'pointerout',
				this.mouseOutWhileDragging,
				{ capture: true }
			);
		if (
			this.dragEventsTargetDocumentTop &&
			targetDocument !== this.dragEventsTargetDocumentTop
		) {
			this.dragEventsTargetDocumentTop.addEventListener(
				'pointerup',
				this.elementDragEnd,
				true
			);
		}

		const targetHtmlElement = targetElement as HTMLElement;
		if (typeof cursor === 'string') {
			this.restoreCursorAfterDrag = restoreCursor.bind(
				this,
				targetHtmlElement.style.cursor
			);
			targetHtmlElement.style.cursor = cursor;
			targetDocument.body.style.cursor = cursor;
		}
		function restoreCursor(this: DragHandler, oldCursor: string): void {
			targetDocument.body.style.removeProperty('cursor');
			targetHtmlElement.style.cursor = oldCursor;
			this.restoreCursorAfterDrag = undefined;
		}
		event.preventDefault();
	}

	private mouseOutWhileDragging(): void {
		this.unregisterMouseOutWhileDragging();
	}

	private unregisterMouseOutWhileDragging(): void {
		if (!DragHandler.rootForMouseOut) {
			return;
		}
		DragHandler.rootForMouseOut.removeEventListener(
			'pointerout',
			this.mouseOutWhileDragging,
			{ capture: true }
		);
	}

	private unregisterDragEvents(): void {
		if (!this.dragEventsTargetDocument) {
			return;
		}
		this.dragEventsTargetDocument.removeEventListener(
			'pointermove',
			this.elementDragMove,
			true
		);
		this.dragEventsTargetDocument.removeEventListener(
			'pointerup',
			this.elementDragEnd,
			true
		);
		if (
			this.dragEventsTargetDocumentTop &&
			this.dragEventsTargetDocument !== this.dragEventsTargetDocumentTop
		) {
			this.dragEventsTargetDocumentTop.removeEventListener(
				'pointerup',
				this.elementDragEnd,
				true
			);
		}
		delete this.dragEventsTargetDocument;
		delete this.dragEventsTargetDocumentTop;
	}

	private elementDragMove(event: MouseEvent): void {
		if (event.buttons !== 1) {
			this.elementDragEnd(event);
			return;
		}
		if (
			this.elementDraggingEventListener &&
			this.elementDraggingEventListener(event)
		) {
			this.cancelDragEvents(event);
		}
	}

	private cancelDragEvents(_event: Event): void {
		this.unregisterDragEvents();
		this.unregisterMouseOutWhileDragging();

		if (this.restoreCursorAfterDrag) {
			this.restoreCursorAfterDrag();
		}

		this.disposeGlassPane();

		delete this.elementDraggingEventListener;
		delete this.elementEndDraggingEventListener;
	}

	private elementDragEnd(event: Event): void {
		const elementDragEnd = this.elementEndDraggingEventListener;
		this.cancelDragEvents(event as MouseEvent);
		event.preventDefault();
		if (elementDragEnd) {
			elementDragEnd(event as MouseEvent);
		}
	}

	private static documentForMouseOut: Document | null = null;
	private static rootForMouseOut: Node | null = null;
}
