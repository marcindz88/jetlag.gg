import { ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, ViewChild } from '@angular/core';
import { degToRad } from 'three/src/math/MathUtils';

@Component({
  selector: 'pg-compass',
  templateUrl: './compass.component.html',
  styleUrls: ['./compass.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompassComponent {
  @Input() set bearing(bearing: number) {
    this.currentBearing = bearing;
    // If view rendered but no active animation is happening
    if (this.compassSeparatorsElement && !this.animationFrameId) {
      this.startCompassAnimation();
      return;
    }

    // If view not rendered set initial transformations
    if (!this.compassSeparatorsElement && bearing !== 0) {
      this.currentCompassAngle = this.currentBearing;
      this.setCurrentAngleSinAndCos();

      this.initialSeparatorsTransformation = this.getSeparatorsTransformation();
      this.initialDirectionTransformations = this.directions.map((element, index) =>
        this.getDirectionTransformation(index)
      );
      this.initialAngleLabelTransformations = this.angleLabels.map((element, index) =>
        this.getAngleLabelTransformation(index)
      );
    }
  }

  @ViewChild('compass', { read: ElementRef }) private set compass(compassRef: ElementRef) {
    if (compassRef) {
      this.setCompassElements(compassRef);
      this.startCompassAnimation();
    }
  }

  readonly directions = [
    { label: 'N', x: 0, y: -100 },
    { label: 'E', x: -100, y: 0 },
    { label: 'S', x: 0, y: 100 },
    { label: 'W', x: 100, y: 0 },
  ];

  readonly angleLabels = [
    { label: 0, x: 0, y: -162.5 },
    { label: 30, x: -81.25, y: -140.73 },
    { label: 60, x: -140.73, y: -81.25 },
    { label: 90, x: -162.5, y: 0 },
    { label: 120, x: -140.73, y: 81.25 },
    { label: 150, x: -81.25, y: 140.73 },
    { label: 180, x: 0, y: 162.5 },
    { label: 210, x: 81.25, y: 140.73 },
    { label: 240, x: 140.73, y: 81.25 },
    { label: 270, x: 162.5, y: 0 },
    { label: 300, x: 140.73, y: -81.25 },
    { label: 330, x: 81.25, y: -140.73 },
  ];

  initialSeparatorsTransformation = '';
  initialDirectionTransformations: (string | undefined)[] = this.directions.map(() => undefined);
  initialAngleLabelTransformations: (string | undefined)[] = this.angleLabels.map(() => undefined);

  private currentBearing = 0;

  private currentCompassAngle = 0;
  private currentCompassAngleCos = 1;
  private currentCompassAngleSin = 0;

  private compassSeparatorsElement?: HTMLElement;
  private compassDirectionsElements?: HTMLElement[];
  private compassAngleLabelsElements?: HTMLElement[];

  private animationFrameId?: number;

  constructor(private ngZone: NgZone) {}

  private setCompassElements(compassRef: ElementRef) {
    const compass: HTMLElement = compassRef.nativeElement as HTMLElement;

    this.compassSeparatorsElement = compass.querySelector('.compass__separators') || undefined;
    this.compassDirectionsElements = this.getElementChildren(compass.querySelector('.compass__directions'));
    this.compassAngleLabelsElements = this.getElementChildren(compass.querySelector('.compass__angle-labels'));
  }

  private setCurrentAngleSinAndCos() {
    const angle = degToRad(this.currentCompassAngle);
    this.currentCompassAngleCos = Math.cos(angle);
    this.currentCompassAngleSin = Math.sin(angle);
  }

  private getElementChildren(element: HTMLElement | null): HTMLElement[] | undefined {
    const children = element?.children;
    return children ? (Array.from(children) as HTMLElement[]) : undefined;
  }

  private startCompassAnimation() {
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(() => this.animateCompass());
    });
  }

  private animateCompass() {
    // Finish animation if bearing is correctly setup
    if (this.currentBearing === this.currentCompassAngle) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = undefined;
      }
      return;
    }

    // Determine current rotation
    let difference = this.currentBearing - this.currentCompassAngle;
    let absDifference = Math.abs(difference);

    if (absDifference > 180) {
      this.currentCompassAngle += Math.sign(difference) * 360;
      difference = this.currentBearing - this.currentCompassAngle;
      absDifference = Math.abs(difference);
    }

    const currentRotationChange = Math.sign(difference) * Math.min(Math.max(absDifference / 20, 0.02), absDifference);

    // Update current angle
    this.currentCompassAngle += currentRotationChange;
    this.setCurrentAngleSinAndCos();

    // Rotate separators
    this.compassSeparatorsElement?.setAttribute('transform', this.getSeparatorsTransformation());

    // Rotate direction labels
    this.compassDirectionsElements?.forEach((element, index) => {
      element.setAttribute('transform', this.getDirectionTransformation(index));
    });

    // Rotate angle labels
    this.compassAngleLabelsElements?.forEach((element, index) => {
      element.setAttribute('transform', this.getAngleLabelTransformation(index));
    });

    this.startCompassAnimation();
  }

  private getSeparatorsTransformation(): string {
    return `rotate(${this.currentCompassAngle.toFixed(2)} 175 175)`;
  }

  private getDirectionTransformation(index: number): string {
    const direction = this.directions[index];
    return this.determineCurrentTranslationOfObject(direction.x, direction.y);
  }

  private getAngleLabelTransformation(index: number): string {
    const angleLabel = this.angleLabels[index];
    return this.determineCurrentTranslationOfObject(angleLabel.x, angleLabel.y);
  }

  private determineCurrentTranslationOfObject(x: number, y: number) {
    const xTranslation = -x * this.currentCompassAngleCos - y * this.currentCompassAngleSin - x;
    const yTranslation = -x * this.currentCompassAngleSin + y * this.currentCompassAngleCos - y;
    return `translate(${xTranslation.toFixed(2)}, ${yTranslation.toFixed(2)})`;
  }
}
