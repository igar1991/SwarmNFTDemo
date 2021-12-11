import './App.css';
import {useEffect, useState} from "react";
import SwarmNFT from "swarm-nft/SwarmNFT.min";
import {Bee} from "@ethersphere/bee-js"

const {providers} = require('ethers');

function App() {
    const [status, setStatus] = useState('');
    const [swarmNftInstance, setSwarmNftInstance] = useState(null);
    const [metamaskInstalled, setMetamaskInstalled] = useState(false);
    const [networkId, setNetworkId] = useState(null);
    const [userAddress, setUserAddress] = useState('');
    const [uploadResult, setUploadResult] = useState(null);

    useEffect(_ => {
        const doAsync = async () => {
            if (typeof window.ethereum === 'undefined') {
                return;
            }

            const bee = new Bee('https://bee-0.gateway.ethswarm.org');
            // const provider = new providers.JsonRpcProvider('https://dai.poa.network');
            const provider = new providers.Web3Provider(window.ethereum, 'any');
            const addresses = await provider.send("eth_requestAccounts", []);
            setUserAddress(addresses[0]);
            const signer = provider.getSigner();
            const instance = new SwarmNFT(bee, provider, signer, {
                erc721Address: '0xc5caC9F4610fb874F54aF5B12c19Cc5fECF75469'
            });
            instance.setGatewayPostageBatchId();

            setSwarmNftInstance(instance);
        }


        doAsync().then();
    }, []);

    useEffect(() => {
        if (typeof window.ethereum === 'undefined') {
            setMetamaskInstalled(false);
            return;
        }

        setNetworkId(parseInt(window.ethereum.networkVersion));
        console.log('setNetworkId', window.ethereum.networkVersion);
        window.ethereum.on('chainChanged', chainId => {
            console.log('chain changed', chainId, parseInt(chainId));
            setNetworkId(parseInt(chainId));
        });
        setMetamaskInstalled(true);
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                {(metamaskInstalled && networkId !== 100) && <div className="text-center mt-5">
                    <div className="alert alert-warning" role="alert">
                        Please, <a
                        target="_blank"
                        href="https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup">configure and switch
                        to
                        xDai
                        network</a>
                    </div>
                </div>}

                {metamaskInstalled && networkId === 100 && <div>
                    <p>
                        Upload content to Swarm and make NFT!
                    </p>

                    <p>Your address: {userAddress}</p>

                    {status !== '' && <div>
                        <button onClick={_ => {
                            setStatus('');
                        }
                        }>
                            Reset file
                        </button>
                    </div>}

                    {status === '' && <form>
                        <input type="file"

                               onChange={async e => {
                                   console.log('changed', e.target.files);
                                   const result = await swarmNftInstance.uploadNFT(e.target.files[0], '.jpg', {
                                       title: "My super title",
                                       description: "My super description"
                                   });
                                   console.log('result', result);
                                   setUploadResult(result);
                                   setStatus('uploaded');
                               }}/>
                    </form>}

                    {status === 'uploaded' && <div>
                        <p>Meta url: <a target="_blank" href={uploadResult.metaUrl}>{uploadResult.metaUrl}</a></p>
                        <p>Content url: <a target="_blank" href={uploadResult.imageUrl}>{uploadResult.imageUrl}</a></p>
                        <button onClick={async _ => {
                            setStatus('minting');
                            try {
                                const nftResult = await swarmNftInstance.mintNFT(userAddress, uploadResult.metaUrl);
                                await nftResult.wait();
                            } catch (e) {
                                console.log(e);
                                setStatus('error');
                            }

                            setStatus('minted');
                        }
                        }>
                            Mint NFT
                        </button>
                    </div>}

                    {status === 'minting' && <div>
                        Minting your NFT...
                    </div>}

                    {status === 'minted' && <div>
                        Minted! <a target="_blank"
                                   href="https://blockscout.com/xdai/mainnet/token/0xc5caC9F4610fb874F54aF5B12c19Cc5fECF75469">View</a>
                    </div>}

                    {status === 'error' && <div>
                        Some error happens(
                    </div>}
                </div>}
            </header>
        </div>
    );
}

export default App;
