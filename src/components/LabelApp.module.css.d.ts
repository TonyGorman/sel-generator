export type Styles = {
  'actionsRow': string;
  'barcodeGraphic': string;
  'barcodeGraphicLargeSel': string;
  'encodedValue': string;
  'encodedValueLargeSel': string;
  'formStack': string;
  'generateButton': string;
  'labelAppRoot': string;
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
  'sectionIntro': string;
  'variantControlLabel': string;
  'variantControlRow': string;
  'variantControlSelect': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
