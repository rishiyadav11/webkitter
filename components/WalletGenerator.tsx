"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import nacl from "tweetnacl";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import bs58 from "bs58";
import { ethers } from "ethers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Grid2X2,
  List,
  Trash,
  Bolt,
  Circle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import Link from "next/link";

interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
}

const WalletGenerator = () => {
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(
    Array(12).fill(" ")
  );
  const [pathTypes, setPathTypes] = useState<string[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);
  const [gridView, setGridView] = useState<boolean>(false);
  const pathTypeNames: { [key: string]: string } = {
    "501": "Solana",
    "60": "Ethereum",
  };

  const pathTypeName = pathTypeNames[pathTypes[0]] || "";

  useEffect(() => {
    const storedWallets = localStorage.getItem("wallets");
    const storedMnemonic = localStorage.getItem("mnemonics");
    const storedPathTypes = localStorage.getItem("paths");

    if (storedWallets && storedMnemonic && storedPathTypes) {
      setMnemonicWords(JSON.parse(storedMnemonic));
      setWallets(JSON.parse(storedWallets));
      setPathTypes(JSON.parse(storedPathTypes));
      setVisiblePrivateKeys(JSON.parse(storedWallets).map(() => false));
      setVisiblePhrases(JSON.parse(storedWallets).map(() => false));
    }
  }, []);

  const handleDeleteWallet = (index: number) => {
    const updatedWallets = wallets.filter((_, i) => i !== index);
    const updatedPathTypes = pathTypes.filter((_, i) => i !== index);

    setWallets(updatedWallets);
    setPathTypes(updatedPathTypes);
    localStorage.setItem("wallets", JSON.stringify(updatedWallets));
    localStorage.setItem("paths", JSON.stringify(updatedPathTypes));
    setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
    setVisiblePhrases(visiblePhrases.filter((_, i) => i !== index));
    toast.success("Wallet deleted successfully!");
  };

  const handleClearWallets = () => {
    localStorage.removeItem("wallets");
    localStorage.removeItem("mnemonics");
    localStorage.removeItem("paths");
    setWallets([]);
    setMnemonicWords([]);
    setPathTypes([]);
    setVisiblePrivateKeys([]);
    setVisiblePhrases([]);
    toast.success("All wallets cleared.");
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const togglePrivateKeyVisibility = (index: number) => {
    setVisiblePrivateKeys(
      visiblePrivateKeys.map((visible, i) => (i === index ? !visible : visible))
    );
  };

  const togglePhraseVisibility = (index: number) => {
    setVisiblePhrases(
      visiblePhrases.map((visible, i) => (i === index ? !visible : visible))
    );
  };

  const generateWalletFromMnemonic = (
    pathType: string,
    mnemonic: string,
    accountIndex: number
  ): Wallet | null => {
    try {
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      if (pathType === "501") {
        // Solana
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keypair = Keypair.fromSecretKey(secretKey);

        privateKeyEncoded = bs58.encode(secretKey);
        publicKeyEncoded = keypair.publicKey.toBase58();
      } else if (pathType === "60") {
        // Ethereum
        const privateKey = Buffer.from(derivedSeed).toString("hex");
        privateKeyEncoded = privateKey;

        const wallet = new ethers.Wallet(`0x${privateKey}`);
        publicKeyEncoded = wallet.address;
      } else {
        toast.error("Unsupported path type.");
        return null;
      }

      return {
        publicKey: publicKeyEncoded,
        privateKey: privateKeyEncoded,
        mnemonic,
        path,
      };
    } catch (error) {
      toast.error("Failed to generate wallet. Please try again.");
      return null;
    }
  };

  const handleGenerateWallet = () => {
    let mnemonic = mnemonicInput.trim();

    if (mnemonic) {
      if (!validateMnemonic(mnemonic)) {
        toast.error("Invalid recovery phrase. Please try again.");
        return;
      }
    } else {
      mnemonic = generateMnemonic();
    }

    const words = mnemonic.split(" ");
    setMnemonicWords(words);

    const wallet = generateWalletFromMnemonic(
      pathTypes[0],
      mnemonic,
      wallets.length
    );
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      localStorage.setItem("mnemonics", JSON.stringify(words));
      localStorage.setItem("paths", JSON.stringify(pathTypes));
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast.success("Wallet generated successfully!");
    }
  };

  const handleAddWallet = () => {
    if (!mnemonicWords) {
      toast.error("No mnemonic found. Please generate a wallet first.");
      return;
    }

    const wallet = generateWalletFromMnemonic(
      pathTypes[0],
      mnemonicWords.join(" "),
      wallets.length
    );
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      const updatedPathType = [pathTypes, pathTypes];
      setWallets(updatedWallets);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      localStorage.setItem("pathTypes", JSON.stringify(updatedPathType));
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast.success("Wallet generated successfully!");
    }
  };
  return (
    <div className="flex flex-col gap-4">
      {wallets.length === 0 && (
<motion.div
  className="flex flex-col gap-6"
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeInOut" }}
>
  <div className="flex flex-col gap-6">
    {pathTypes.length === 0 && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex flex-col my-12"
      >
        <div className="flex flex-col gap-3">
          <h1 className="tracking-tighter text-4xl md:text-5xl text-center font-extrabold text-gradient bg-clip-text ">
            Webkitter supports multiple blockchains
          </h1>
          <p className="text-primary/80 font-semibold text-lg text-center md:text-xl">
            Choose a blockchain to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {[
            {
              name: "Solana",
              image: "/sol.jpg", // replace with your image path
              desc: "High-performance blockchain known for fast transactions and low fees.",
              type: "501",
              color: "from-purple-400 via-pink-500 to-indigo-500",
            },
            {
              name: "Ethereum",
              image: "/etherium.jpg", // replace with your image path
              desc: "The leading smart contract platform for decentralized applications.",
              type: "60",
              color: "from-blue-400 via-purple-500 to-pink-500",
            },
          ].map((chain) => (
            <motion.div
              key={chain.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setPathTypes([chain.type]);
                toast.success(`${chain.name} wallet selected. Please generate a wallet to continue.`);
              }}
              className={`relative flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              {/* Gradient glow border */}
              <div
                className={`absolute inset-0 p-[2px] rounded-2xl bg-gradient-to-r ${chain.color} opacity-30 blur-xl -z-10`}
              />

              {/* Image */}
              <img
                src={chain.image}
                alt={chain.name}
                className="w-full h-52 object-cover rounded-t-2xl"
              />

              {/* Content */}
              <div className="p-6 flex flex-col gap-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tighter">{chain.name}</h2>
                <p className="text-primary/80">{chain.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )}

    {pathTypes.length !== 0 && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex flex-col gap-6 my-12"
      >
        <div className="flex flex-col gap-2 ">
          <h1 className="tracking-tighter text-center text-4xl md:text-5xl font-extrabold ">
            Secret Recovery Phrase
          </h1>
          <p className="text-primary/80 text-center font-semibold text-lg md:text-xl">
            Save these words in a safe place.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            type="password"
            placeholder="Enter your secret phrase (or leave blank to generate)"
            onChange={(e) => setMnemonicInput(e.target.value)}
            value={mnemonicInput}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 placeholder:text-primary/60 text-primary transition-all duration-300 focus:ring-2 focus:ring-primary"
          />
          <Button
            size={"lg"}
            onClick={() => handleGenerateWallet()}
            className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-white hover:scale-105 transition-transform duration-300"
          >
            {mnemonicInput ? "Add Wallet" : "Generate Wallet"}
          </Button>
        </div>
      </motion.div>
    )}
  </div>
</motion.div>

      )}


{/* Display wallet pairs */}
{wallets.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.3, ease: "easeInOut" }}
    className="flex flex-col gap-8 mt-6"
  >
    <div className="flex md:flex-row flex-col justify-between w-full gap-4 md:items-center">
      <h2 className="tracking-tighter text-3xl md:text-4xl font-extrabold ">
        {pathTypeName} Wallet
      </h2>
      <div className="flex gap-2">
        {wallets.length > 1 && (
          <Button variant="ghost" onClick={() => setGridView(!gridView)} className="hidden md:block ">
            {gridView ? <Grid2X2 /> : <List />}
          </Button>
        )}
        <Button onClick={() => handleAddWallet()} className="bg-purple-600 hover:bg-purple-700 text-white">
          Add Wallet
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="self-end">
              Clear Wallets
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border border-purple-500/30">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete all wallets?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your wallets and keys from local storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel >Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleClearWallets()} className="text-red-500">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

    <div className={`grid gap-6 grid-cols-1 ${gridView ? "md:grid-cols-2 lg:grid-cols-3" : ""}`}>
      {wallets.map((wallet: any, index: number) => (
<motion.div
  key={index}
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 + index * 0.1, duration: 0.3, ease: "easeInOut" }}
  className="flex flex-col rounded-2xl border border-purple-500/30 bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-300"
>
  <div className="flex justify-between px-8 py-6 border-b border-purple-500/20">
    <h3 className="font-bold text-2xl md:text-3xl tracking-tighter text-white">
      Wallet {index + 1}
    </h3>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="flex gap-2 items-center text-red-500">
          <Trash className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gray-900 text-white border border-purple-500/30">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this wallet?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your wallet and keys from local storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDeleteWallet(index)} className="text-red-500">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>

  <div className="flex flex-col gap-6 px-8 py-6 rounded-b-2xl bg-gray-950">
    {/* ✅ Tooltip + double click */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex flex-col w-full gap-2 cursor-pointer"
            onDoubleClick={() => copyToClipboard(wallet.publicKey)}
          >
            <span className="text-lg md:text-xl font-bold tracking-tighter text-purple-400">
              Public Key
            </span>
            <p className="text-white font-medium truncate hover:text-purple-300 transition-all duration-300">
              {wallet.publicKey}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Double-click to copy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    {/* Private Key */}
    <div className="flex flex-col w-full gap-2">
      <span className="text-lg md:text-xl font-bold tracking-tighter text-purple-400">Private Key</span>
      <div className="flex justify-between w-full items-center gap-2">
        <p
          onClick={() => copyToClipboard(wallet.privateKey)}
          className="text-white font-medium cursor-pointer hover:text-purple-300 transition-all duration-300 truncate"
        >
          {visiblePrivateKeys[index]
            ? wallet.privateKey
            : "•".repeat(wallet.privateKey.length > 50 ? 50 : wallet.privateKey.length)}
        </p>
        <Button
          variant="ghost"
          onClick={() => togglePrivateKeyVisibility(index)}
          className="text-white"
        >
          {visiblePrivateKeys[index] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>

    {/* Open Wallet Button */}
    <Link href={`/wallet/${index}`}>
      <Button className="w-full mt-4 bg-purple-600 text-white hover:bg-purple-700">
        Open Wallet
      </Button>
    </Link>
  </div>
</motion.div>


      ))}
    </div>
  </motion.div>
)}
      {/* Display Secret Phrase */}
{mnemonicWords && wallets.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="group flex flex-col items-center gap-4 cursor-pointer rounded-2xl border border-purple-500/20 p-8 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 shadow-xl"
  >
    <div
      className="flex w-full justify-between items-center"
      onClick={() => setShowMnemonic(!showMnemonic)}
    >
      <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-white">
        Your Secret Phrase
      </h2>
      <Button onClick={() => setShowMnemonic(!showMnemonic)} variant="ghost">
        {showMnemonic ? <ChevronUp className="size-4 text-black " /> : <ChevronDown className="size-4 text-white bg-black w-full" />}
      </Button>
    </div>

    {showMnemonic && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col w-full items-center justify-center mt-4 cursor-pointer"
        onClick={() => copyToClipboard(mnemonicWords.join(" "))}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 justify-center w-full items-center mx-auto my-6"
        >
          {mnemonicWords.map((word, index) => (
            <p
              key={index}
              className="md:text-lg bg-gray-800 hover:bg-purple-800/50 text-white transition-all duration-300 rounded-lg py-2 px-3 text-center font-medium tracking-wide shadow-sm"
            >
              {word}
            </p>
          ))}
        </motion.div>
        <div className="text-sm md:text-base flex justify-center text-purple-400/70  w-full gap-2 items-center group-hover:text-purple-400 transition-all duration-300">
          <Copy className="size-4 " /> Click Anywhere To Copy
        </div>
      </motion.div>
    )}
  </motion.div>
)}


    </div>
  );
};

export default WalletGenerator;