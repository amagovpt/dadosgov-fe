export function getAssets(fileName: string) {
    const assetUrl = process.env.NEXT_PUBLIC_API_URL+'/api/assets/';


    return assetUrl + fileName;
}