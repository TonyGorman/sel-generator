export type Styles = {
  'barcodeGraphic': string;
  'barcodeGraphicLargeSel': string;
  'encodedValue': string;
  'encodedValueLargeSel': string;
  'labelBox': string;
  'labelBoxLargeSel': string;
  'labelText': string;
  'largeSelHeading': string;
  'largeSelHeadingMain': string;
  'largeSelHeadingPrefix': string;
  'largeSelHeadingSuffix': string;
  'largeSelLabelTextArea': string;
  'miniAisleBottomCode': string;
  'miniAisleTopCode': string;
  'miniShelfFullValue': string;
  'primaryCode': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
