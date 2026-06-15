export type Styles = {
  'actionBar': string;
  'actionButton': string;
  'actionsRow': string;
  'barcodeGraphic': string;
  'barcodeGraphicLargeSel': string;
  'encodedValue': string;
  'encodedValueLargeSel': string;
  'exportSurface': string;
  'formStack': string;
  'generateButton': string;
  'labelAppRoot': string;
  'labelBox': string;
  'labelBoxLargeSel': string;
  'labelDiv': string;
  'labelText': string;
  'largeSelHeading': string;
  'largeSelHeadingFallback': string;
  'largeSelHeadingMain': string;
  'largeSelHeadingPrefix': string;
  'largeSelHeadingSuffix': string;
  'largeSelLabelTextArea': string;
  'loaderBox': string;
  'pdfDiv': string;
  'previewPage': string;
  'primaryCode': string;
  'printLabelDiv': string;
  'printPage': string;
  'printPortal': string;
  'secondaryCode': string;
  'sectionIntro': string;
  'tabButton': string;
  'tabButtonActive': string;
  'tabList': string;
  'tabPanelBox': string;
  'tabPanelContent': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
