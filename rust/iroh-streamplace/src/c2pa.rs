use c2pa::Reader;
use std::io::Cursor;

#[derive(Debug, thiserror::Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum CertError {
    #[error("No certificate chain found")]
    NoCertificateChainFound,
    #[error("C2PA error: {0}")]
    C2paError(String),
}

#[uniffi::export]
pub fn print_cert(data: Vec<u8>) -> Result<String, CertError> {
    let reader = Reader::from_stream("video/mp4", Cursor::new(data))
        .map_err(|e| CertError::C2paError(e.to_string()))?;
    // todo: add cawg certs here??
    if let Some(manifest) = reader.active_manifest() {
        if let Some(si) = manifest.signature_info() {
            println!("{}", si.cert_chain());
            // todo: add ocsp validation info
            return Ok(si.cert_chain().to_string());
        }
    }
    Err(CertError::NoCertificateChainFound)
}

#[uniffi::export]
pub fn get_manifest(data: Vec<u8>) -> Result<String, CertError> {
    let reader = Reader::from_stream("video/mp4", Cursor::new(data))
        .map_err(|e| CertError::C2paError(e.to_string()))?;
    // todo: add cawg certs here??
    if let Some(manifest) = reader.active_manifest() {
        return Ok(manifest.to_string());
    }
    Err(CertError::NoCertificateChainFound)
}
