export const decodeBlob = (data) => {
    return Buffer.from(data).toString('utf-8')
}