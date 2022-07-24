import { TouchEventLocation } from '@pg/game/models/keyboard-events.types';
import { filter, map, Observable } from 'rxjs';

export const filterByTouchId = (id: number) => (observable: Observable<TouchEvent>) =>
  observable.pipe(filter(event => !!findTouchById(event.changedTouches, id)));

export const mapToTouch =
  (location: TouchEventLocation, id?: number) =>
  (observable: Observable<TouchEvent>): Observable<Touch | null> =>
    observable.pipe(
      map((event: TouchEvent) => {
        if (!id) {
          return findInsideOfTouchList(event.changedTouches, point => isPointInsideTouchArea(point, location));
        }
        const touch = findTouchById(event.changedTouches, id);
        return isPointInsideTouchArea(touch, location) ? touch : null;
      })
    );

export const findTouchById = (touchlist: TouchList, id: number) => {
  return findInsideOfTouchList(touchlist, point => point.identifier === id);
};

export const findInsideOfTouchList = (touchlist: TouchList, predicate: (touch: Touch) => boolean): Touch | null => {
  for (let i = 0; i < touchlist.length; i++) {
    const touch = touchlist[i];
    if (predicate(touch)) {
      return touch;
    }
  }
  return null;
};

export const isPointInsideTouchArea = (touch: Touch | null, location: TouchEventLocation): boolean => {
  const translatedLocation = getTranslatedLocation(location);

  return (
    !!touch &&
    touch.clientX + touch.radiusX >= translatedLocation.xMin &&
    touch.clientX - touch.radiusX <= translatedLocation.xMax &&
    touch.clientY + touch.radiusY >= translatedLocation.yMin &&
    touch.clientY - touch.radiusY <= translatedLocation.yMax
  );
};

const getTranslatedLocation = (location: TouchEventLocation): TouchEventLocation => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    xMin: (location.xMin * width) / 100,
    xMax: (location.xMax * width) / 100,
    yMin: (location.yMin * height) / 100,
    yMax: (location.yMax * height) / 100,
  };
};
