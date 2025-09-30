/// An Error.
#[derive(Debug, snafu::Snafu, uniffi::Error)]
#[uniffi(flat_error)]
#[snafu(visibility(pub(crate)))]
pub enum Error {
    #[snafu(display("Bind failure"), context(false))]
    IrohBind { source: iroh::endpoint::BindError },
    #[snafu(display("Failed to connect"), context(false))]
    IrohConnect {
        source: iroh::endpoint::ConnectError,
    },
    MissingConnection,
    #[snafu(display("RPC error"), context(false))]
    Irpc { source: irpc::Error },
}
