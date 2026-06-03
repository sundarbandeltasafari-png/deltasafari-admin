import base64url from 'base64url';

export const urlEncode = (data) => {
    return base64url.encode(data.toString());
}

export const urlDecode = (data) => {
    return base64url.decode(data.toString());
}