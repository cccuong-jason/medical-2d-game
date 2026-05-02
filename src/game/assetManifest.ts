import manifest from './AssetManifest.json';

type WorldAssetClass = 'worldSprite' | 'tile' | 'wallSlice';
type InterfaceAssetClass = 'uiPortrait' | 'uiOverlay' | 'cameraEffect';

export type AssetManifest = typeof manifest;
export type AssetCatalog = AssetManifest['assets'];
export type WorldAssetKey =
  | keyof AssetCatalog['characters']
  | keyof AssetCatalog['props']
  | keyof AssetCatalog['tiles'];
export type InterfaceAssetKey =
  | keyof AssetCatalog['portraits']
  | keyof AssetCatalog['effects'];

export const assetManifest = manifest;

export function isWorldAsset(assetClass: string): assetClass is WorldAssetClass {
  return assetClass === 'worldSprite' || assetClass === 'tile' || assetClass === 'wallSlice';
}

export function isInterfaceAsset(
  assetClass: string
): assetClass is InterfaceAssetClass {
  return assetClass === 'uiPortrait' || assetClass === 'uiOverlay' || assetClass === 'cameraEffect';
}

export function countFoundationAssets() {
  const catalog = assetManifest.assets;

  return {
    characters: Object.keys(catalog.characters).length,
    props: Object.keys(catalog.props).length,
    portraits: Object.keys(catalog.portraits).length,
    tiles: Object.keys(catalog.tiles).length
  };
}
