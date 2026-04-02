import { useEffect } from 'react';
import { useEditingContextStore, type ContentType, type EditingActivity } from '../stores/editing-context-store';
import type { Layer } from '../types/project';

/**
 * Hook to track editing context from Canvas component
 * Minimal integration required - just call in Canvas component
 */
export function useCanvasEditingContext(
  selectedLayerIds: string[],
  layers: Layer[] | null,
  isDragging: boolean,
  dragMode: string,
) {
  const { updateSelection, recordAction, setActivity, recordPropertyEdit } =
    useEditingContextStore();

  // Track selection changes
  useEffect(() => {
    if (selectedLayerIds.length > 0 && layers) {
      // Get layer types for selected layers
      const types: ContentType[] = selectedLayerIds.map((id) => {
        const layer = layers.find((l) => l.id === id);
        const type = layer?.type || 'group';
        const typeMap: Record<string, ContentType> = {
          text: 'text',
          image: 'image',
          shape: 'shape',
          group: 'layer',
        };
        return (typeMap[type] as ContentType) || 'layer';
      });

      updateSelection(selectedLayerIds.length, types);
    } else if (selectedLayerIds.length === 0) {
      updateSelection(0, []);
    }
  }, [selectedLayerIds, layers, updateSelection]);

  // Track dragging mode changes
  useEffect(() => {
    if (!isDragging) return;

    const activityMap: Record<string, EditingActivity> = {
      move: 'moving',
      resize: 'resizing',
      rotate: 'rotating',
      paint: 'drawing',
      crop: 'cropping',
      marquee: 'selecting',
    };

    const activity = (activityMap[dragMode] as EditingActivity) || 'selecting';

    if (activity === 'moving') {
      setActivity(activity, 'layer');
    } else if (activity === 'drawing') {
      setActivity(activity, 'shape');
    } else if (activity === 'resizing' || activity === 'rotating') {
      setActivity(activity, 'layer');
    } else if (activity === 'cropping') {
      setActivity(activity, 'image');
    } else {
      setActivity(activity, 'layer');
    }
  }, [isDragging, dragMode, setActivity]);

  return {
    recordAction,
    recordPropertyEdit,
    setActivity,
  };
}

/**
 * Map layer properties to property edit tracking
 */
export function trackLayerPropertyChange(property: string) {
  const { recordPropertyEdit } = useEditingContextStore.getState();

  const propertyMap: Record<string, { property: string; activity: EditingActivity }> =
    {
      color: { property: 'color', activity: 'coloring' },
      opacity: { property: 'opacity', activity: 'adjusting-opacity' },
      scale: { property: 'scale', activity: 'resizing' },
      rotation: { property: 'rotation', activity: 'rotating' },
      x: { property: 'x', activity: 'moving' },
      y: { property: 'y', activity: 'moving' },
      width: { property: 'width', activity: 'resizing' },
      height: { property: 'height', activity: 'resizing' },
      blendMode: { property: 'blendMode', activity: 'adjusting-opacity' },
      filter: { property: 'filter', activity: 'applying-filter' },
      effect: { property: 'effect', activity: 'applying-effect' },
      shadow: { property: 'shadow', activity: 'applying-effect' },
      fontSize: { property: 'fontSize', activity: 'typing' },
      fontFamily: { property: 'fontFamily', activity: 'typing' },
      fontWeight: { property: 'fontWeight', activity: 'typing' },
      textColor: { property: 'textColor', activity: 'coloring' },
    };

  const mapped = propertyMap[property];
  if (mapped) {
    recordPropertyEdit(mapped.property);
  } else {
    recordPropertyEdit(property);
  }
}
