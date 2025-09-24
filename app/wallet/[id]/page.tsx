"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ethers } from "ethers";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export default function WalletPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const index = parseInt(id, 10);

  const [wallet, setWallet] = useState<any>(null);
  const [balance, setBalance] = useState<string>("0");
  const [sendAddress, setSendAddress] = useState("");
  const [amount, setAmount] = useState("");

  // Load wallet from localStorage
  useEffect(() => {
    const storedWallets = localStorage.getItem("wallets");
    if (storedWallets && !isNaN(index)) {
      const wallets = JSON.parse(storedWallets);
      setWallet(wallets[index]);
    }
  }, [index]);

  // Fetch balance
  const fetchBalance = async () => {
    if (!wallet) return;

    try {
      if (wallet.path.includes("501")) {
        // Solana Devnet
        const connection = new Connection("https://api.devnet.solana.com");
        const bal = await connection.getBalance(new PublicKey(wallet.publicKey));
        setBalance((bal / LAMPORTS_PER_SOL).toFixed(4) + " SOL");
      } else if (wallet.path.includes("60")) {
        // Ethereum Sepolia
        const provider = new ethers.JsonRpcProvider(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
        );
        const bal = await provider.getBalance(wallet.publicKey);
        setBalance(ethers.formatEther(bal) + " ETH");
      }
    } catch (err: any) {
      toast.error("Failed to fetch balance: " + err.message);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [wallet]);

  // Send transaction
  const handleSend = async () => {
    if (!wallet) return;
    if (!sendAddress || !amount) {
      toast.error("Enter recipient and amount");
      return;
    }

    try {
      if (wallet.path.includes("60")) {
        // Ethereum Sepolia
        const provider = new ethers.JsonRpcProvider(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
        );
        const signer = new ethers.Wallet(wallet.privateKey, provider);
        const tx = await signer.sendTransaction({
          to: sendAddress,
          value: ethers.parseEther(amount),
        });
        toast.success("ETH Tx sent: " + tx.hash);
      } else if (wallet.path.includes("501")) {
        // Solana Devnet
        const connection = new Connection("https://api.devnet.solana.com");
        const fromKeypair = Keypair.fromSecretKey(Uint8Array.from(wallet.privateKey));
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: new PublicKey(sendAddress),
            lamports: Number(amount) * LAMPORTS_PER_SOL,
          })
        );
        await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
        toast.success(`Sent ${amount} SOL to ${sendAddress}`);
      }
      fetchBalance(); // update balance after sending
    } catch (err: any) {
      toast.error("Transaction failed: " + err.message);
    }
  };

  // Get Testnet Funds
  const handleGetTestnet = async () => {
    if (!wallet) return;

    try {
      if (wallet.path.includes("501")) {
        // Solana Devnet
        const connection = new Connection("https://api.devnet.solana.com");
        const signature = await connection.requestAirdrop(
          new PublicKey(wallet.publicKey),
          LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(signature);
        toast.success("1 SOL airdropped!");
        fetchBalance();
      } else if (wallet.path.includes("60")) {
        // Ethereum Sepolia from funded wallet
        const provider = new ethers.JsonRpcProvider(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
        );
        const fundedWallet = new ethers.Wallet(
          process.env.NEXT_PUBLIC_FUNDED_SEPOLIA_PRIVATE_KEY as string,
          provider
        );
        const tx = await fundedWallet.sendTransaction({
          to: wallet.publicKey,
          value: ethers.parseEther("1.0"),
        });
        await tx.wait();
        toast.success("1 ETH sent from funded wallet!");
        fetchBalance();
      }
    } catch (err: any) {
      toast.error("Failed to get testnet funds: " + err.message);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {wallet ? (
        <>
          <h1 className="text-3xl font-bold">Wallet {index + 1}</h1>
          <p className="text-lg text-purple-400">Address: {wallet.publicKey}</p>

          {/* Balance */}
          <div className="p-4 rounded-xl bg-gray-900 border border-purple-500/30">
            <h2 className="text-xl font-semibold">Balance</h2>
            <p className="text-2xl">{balance}</p>
          </div>

          {/* Get Testnet Funds */}
          <div>
            <Button
              onClick={handleGetTestnet}
              className="bg-green-600 text-white"
            >
              Get Testnet Funds
            </Button>
          </div>

          {/* Send */}
          <div className="p-4 rounded-xl bg-gray-900 border border-purple-500/30 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Send Money</h2>
            <Input
              placeholder="Recipient Address"
              value={sendAddress}
              onChange={(e) => setSendAddress(e.target.value)}
            />
            <Input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={handleSend} className="bg-purple-600 text-white">
              Send
            </Button>
          </div>

          {/* Receive */}
          <div className="p-4 rounded-xl bg-gray-900 border border-purple-500/30 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Receive Money</h2>
            <p className="break-all text-purple-400">{wallet.publicKey}</p>
          </div>
        </>
      ) : (
        <p>Loading wallet...</p>
      )}
    </div>
  );
}
