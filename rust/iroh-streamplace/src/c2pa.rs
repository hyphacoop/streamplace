use c2pa::{
    Builder, ClaimGeneratorInfo, Error, Ingredient, ManifestDefinition, Reader, Signer,
    identity::validator::CawgValidator, settings::Settings,
};

#[derive(Debug, thiserror::Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum CertError {
    #[error("No certificate chain found")]
    NoCertificateChainFound,
    #[error("C2PA error: {0}")]
    C2paError(String),
}

#[uniffi::export]
pub fn print_cert(path: &str) -> Result<(), CertError> {
    let reader = Reader::from_file(path).map_err(|e| CertError::C2paError(e.to_string()))?;
    // todo: add cawg certs here??
    if let Some(manifest) = reader.active_manifest() {
        if let Some(si) = manifest.signature_info() {
            println!("{}", si.cert_chain());
            // todo: add ocsp validation info
            return Ok(());
        }
    }
    Err(CertError::NoCertificateChainFound)
}
