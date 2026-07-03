import { LabelPrintMode } from './ILabelLayoutStrategy';
import { MiniCompositionVariantId } from './IMiniCompositionVariant';

export interface ILabelGenerator {
  labelCodes: string[];
  layoutMode?: LabelPrintMode;
  miniVariantId?: MiniCompositionVariantId;
}
