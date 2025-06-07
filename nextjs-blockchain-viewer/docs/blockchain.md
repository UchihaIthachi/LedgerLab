```markdown
# Blockchain Explained

A blockchain is a distributed, immutable ledger. This means it's a record of transactions or data that is shared among many computers and, once something is recorded, it cannot be easily altered. This technology is the foundation for cryptocurrencies like Bitcoin, but its applications go far beyond.

## Core Concepts

### 1. Blocks

*   **Theory:** A block is a container for data. In the context of a cryptocurrency, this data primarily consists of a bundle of transactions. Each block also contains a unique identifier called a **hash** (explained next) and the hash of the *previous* block in the chain. This linkage is what forms the "chain."
*   **Project Illustration:**
    *   The demo visually represents blocks as distinct units, each with fields for "Block #" (its sequence), "Nonce", "Data", "Prev" (previous hash), and "Hash".
    *   In the "Block" section of the demo ([/block](http://localhost:3000/block)), you can see a single block and manipulate its contents.
    *   In the "Blockchain" section ([/blockchain](http://localhost:3000/blockchain)), you see a series of these blocks linked together.

### 2. Hashes (SHA-256)

*   **Theory:** A hash is like a digital fingerprint for data. It's a unique string of characters generated from an input. Even a tiny change in the input data will result in a completely different hash. Blockchains typically use cryptographic hash functions like SHA-256 (Secure Hash Algorithm 256-bit).
*   **Project Illustration:**
    *   Each block in the demo prominently displays its calculated SHA-256 hash in the "Hash" field.
    *   If you type any character into the "Data" field of a block, you'll see its "Hash" value change instantly. This demonstrates the sensitivity of hash functions.
    *   The demo highlights a block in green if its hash meets a certain criteria (e.g., starts with "0000"), indicating a "signed" or "valid" block in the context of the demo's rules. If the hash doesn't meet the criteria, the block is highlighted in red.

### 3. The Chain & Immutability

*   **Theory:** Each block (except the very first one, called the "genesis block") stores the hash of the previous block. This creates a chronological chain. If someone tries to tamper with the data in an old block, its hash will change. Since this hash was recorded in the *next* block, that next block also becomes invalid. This cascading invalidation makes blockchains extremely secure and immutable. Changing a block requires re-calculating its hash and the hashes of *all subsequent blocks*.
*   **Project Illustration:**
    *   In the "Blockchain" section ([/blockchain](http://localhost:3000/blockchain)), observe the "Prev" field in each block. It contains the hash of the block before it.
    *   If you change the data in, for example, Block #2, its own hash will change. This will cause Block #3 (which stored Block #2's old hash in its "Prev" field) to become invalid (turn red). This visual chain reaction continues all the way to the end of the chain, clearly showing the immutability concept.

### 4. Nonce and Mining

*   **Theory:** To add a new block to the chain, "miners" compete to solve a computationally difficult puzzle. This usually involves finding a specific number called a "Nonce" (Number used once). When this nonce is combined with the block's other data and hashed, the resulting hash must meet certain criteria (e.g., start with a specific number of zeros). This process is called "mining" and is what makes adding new blocks difficult and resource-intensive, further securing the chain. The difficulty can be adjusted by changing the criteria for the hash (e.g., requiring more leading zeros).
*   **Project Illustration:**
    *   Each block has a "Nonce" field.
    *   The "Mine" button triggers a script (`public/javascripts/blockchain.js`) that iterates through different nonce values until it finds one that results in a hash starting with "0000" (the demo's difficulty setting, which can be adjusted in the JS file).
    *   When you change data in a block, it turns red (invalid). Clicking "Mine" will find a new nonce to make the block valid again (green). If you do this on a block in the middle of the chain, you'll then have to re-mine all subsequent blocks as well.

### 5. Distributed Ledger Technology (DLT)

*   **Theory:** Instead of one central authority managing the ledger, a blockchain is typically managed by a distributed network of computers (peers). Each peer holds a copy of the ledger. When a new block is mined, it's broadcast to the network, and each peer validates and adds it to their copy of the chain. This decentralization enhances security and resilience. If one peer is compromised or goes offline, the network continues to operate.
*   **Project Illustration:**
    *   The "Distributed" section ([/distributed](http://localhost:3000/distributed)) shows three "Peers" (Peer A, Peer B, Peer C), each with an identical copy of the blockchain.
    *   If you modify data in a block on Peer A's chain, only Peer A's chain is initially affected and becomes invalid. Peer B and Peer C still have the original, valid chain.
    *   You can then re-mine the blocks on Peer A's chain. However, its final hash will now be different from Peer B and Peer C. This illustrates how different versions of the truth can arise and implicitly shows the need for a consensus mechanism (though the demo doesn't implement one) for the peers to agree on the correct chain.

### 6. Tokens and Coinbase Transactions

*   **Theory:** Blockchains are often used to track the movement of digital assets or "tokens" (like cryptocurrencies). Transactions detailing these movements are bundled into the data part of blocks. A special type of transaction, often called a "coinbase" transaction, is usually the first in a block and is used to create new tokens, often as a reward for the miner who successfully mined that block.
*   **Project Illustration:**
    *   The "Tokens" section ([/tokens](http://localhost:3000/tokens)) shows blocks where the "Data" field is replaced by a list of transactions (e.g., "Darcy sends $25 to Bingley"). Changing any part of these transactions will invalidate the block's hash.
    *   The "Coinbase" section ([/coinbase](http://localhost:3000/coinbase)) demonstrates this concept. Each block includes a coinbase transaction (e.g., "$100 to Anders") which mints new currency, alongside other peer-to-peer transactions. This shows how new value can be introduced into the system.

## How This Project Illustrates Blockchain

This project provides an interactive, visual way to understand the fundamental mechanics of a blockchain:

*   **Hands-on Hashing:** You can directly manipulate data and see hashes change in real-time.
*   **Visual Immutability:** Altering a block clearly shows the "breaking" of the chain, making the concept of an immutable ledger tangible.
*   **Simplified Mining:** The "Mine" button demystifies the concept of mining by showing the search for a valid nonce.
*   **Decentralization Demoed:** The "Distributed" view makes it easy to see how multiple peers maintain copies of the chain and how discrepancies can arise.
*   **Transaction Flow:** The "Tokens" and "Coinbase" views show how financial transactions can be recorded on a blockchain.

By playing with the different sections, users can gain an intuitive grasp of these core blockchain principles without needing to dive deep into complex code or mathematics initially.

---

*The following is a transcript of a video that also explains these concepts:*

# tactiq.io free youtube transcript
# Blockchain 101 - A Visual Demo
# https://www.youtube.com/watch/_160oMzblY8

00:00:01.760 this is a blockchain demo
00:00:04.540 we're gonna do this in a very visual way though
00:00:05.040
00:00:05.540
00:00:07.379 we're gonna make it very easy to understand
00:00:09.480 by stepping through the key pieces of
00:00:12.480 what a blockchain is in a visual way but
00:00:15.630 before we get started we need to take a
00:00:17.220 look at this thing that we call a sha
00:00:20.250 256 hash
00:00:21.990 ok and a hash this is this is one of
00:00:24.990 them right here
00:00:25.980 hash looks like a bunch of random
00:00:27.869 numbers and essentially what it is it's
00:00:30.900 a fingerprint of some digital data and
00:00:33.870 it just so happens it's a fingerprint of
00:00:35.579 whatever i type in this box
00:00:37.469 so if I type my name "anders" into
00:00:40.920 this box you see that the hash has
00:00:44.070 changed matter of fact it changed every
00:00:46.200 time I typed a letter right so I'm going
00:00:49.350 to go back to so it says anders okay so
00:00:52.230 this is a the hash of the name anders
00:00:55.170 all lower case it starts with 19ea
00:00:57.660 right
00:00:58.590 ok so if i delete that and I go again
00:01:01.469 type anders again you can see it starts
00:01:04.709 with 19ea the same exact hash in that
00:01:08.189 sense it's a digital fingerprint of this
00:01:10.200 data whatever data is here every time
00:01:13.740 you type exactly the same data you get
00:01:15.840 exactly the same hash and i can type
00:01:18.150 anything i want so I can you can have
00:01:19.890 nothing like this you know e3b0
00:01:22.979 that's that's the hash of nothing or you
00:01:25.619 could type tons and tons of stuff a
00:01:28.020 matter of fact you could put like the
00:01:29.430 library of congress in here and you
00:01:31.890 would get a hash and the interesting
00:01:34.079 thing about it is regardless of their if
00:01:37.020 there's a tiny amount of information no
00:01:39.060 information or the entire library of
00:01:40.890 congress you're always going to get a
00:01:42.869 hash that is this long this many
00:01:45.149 characters are you not going to be able
00:01:46.439 to pre guess what this is you kind of
00:01:49.799 have to put the library of congress in
00:01:52.170 here to figure out what the hash is but
00:01:54.600 you you'll always get exactly the same
00:01:58.409 hash regardless of how many times you
00:02:01.500 put exactly the same information in so
00:02:04.860 what I'm going to do is extend this idea
00:02:10.229 of a hash
00:02:11.440 into something that we're going to
00:02:13.510 call a block
00:02:14.920 alright so let's take a look at a block
00:02:16.420 so this is a block and it's exactly like
00:02:21.220 the hash it's just that data section
00:02:24.310 I've broken out now into three sections
00:02:25.990 one called block this is just some kind
00:02:28.420 of a number this block number 1 a nonce
00:02:31.660 which is just yet another number will go
00:02:34.030 into what that is in a second and then
00:02:35.830 just some more data just very similarly
00:02:37.720 to the way that we had it before
00:02:40.420 however the hash of this which includes
00:02:44.380 all of this information up here is down
00:02:47.290 here and it begins with four zeros you see that
00:02:50.470 it's a relatively unusual hash you know
00:02:54.130 most of them are not really going to
00:02:55.840 start with four zeros like that but this one
00:02:57.880 happens to and because it does totally
00:03:01.000 arbitrarily i'm going to say that this
00:03:03.400 block is signed
00:03:04.900 ok so what would happen if i were to
00:03:08.680 change any one piece of this information
00:03:11.230 let's say if i were to type something here
00:03:13.120 right the hash is going to change and
00:03:16.630 what's the chance of that if i type
00:03:18.400 letters this hash is going to start with
00:03:20.260 four zeros pretty low it's probably not
00:03:23.050 right so let's see what happens when i
00:03:25.840 do that i'm just going to say hi
00:03:28.959 look at that right this hash does not
00:03:31.600 start with four zeros and so the big
00:03:33.850 background here has turned red
00:03:36.400 so now you know that this this block
00:03:38.950 with this information in it is not a
00:03:42.489 valid or a signed block ok and that's
00:03:46.120 where this nonce comes in this
00:03:48.220 nonce is just a number that you can set
00:03:50.320 to try to find a number that fits so
00:03:54.130 that this hash starts with four zeros again
00:03:57.190 alright so how do we do that well let's
00:03:58.630 start with one that start with now it's
00:04:00.970 32 so that's not one let's try two FF
00:04:03.940 now
00:04:04.630 3 4 5 6 so you get the idea like i
00:04:08.530 could sit here all there's one that
00:04:09.700 starts with 0 I can sit here all day
00:04:12.070 typing these numbers and trying to
00:04:15.100 figure out one that actually is going to
00:04:18.399 hash out to something that starts with
00:04:20.048 four zeros that wold take a long time so
00:04:22.900 here i have my little
00:04:25.000 mine button i'm sure you've been wondering
00:04:26.230 what happens if i press that so what's
00:04:29.050 going to happen when i press this mine
00:04:30.670 button is it's gonna run through all the
00:04:33.340 numbers from 1 all the way up to try to
00:04:36.550 find one where the hash starts with four
00:04:38.950 zeros and this process is called mining
00:04:41.050 let's do it right now
00:04:43.060 now it's checking all of the numbers
00:04:45.460 from 1 all the way up with their now
00:04:48.280 it's stopped at 59,396 and that one
00:04:52.840 just happens to hash out to something
00:04:55.870 that starts with four zeros and it
00:04:58.060 satisfies my little definition of what
00:05:01.060 assigned block is ok so that's that's a
00:05:03.940 block now can you tell me what a
00:05:07.480 blockchain is it's probably just a chain
00:05:11.770 of these blocks well how do you how do
00:05:13.600 you put them together let's let's do
00:05:15.910 that
00:05:16.660 alright so here's my blockchain I've
00:05:19.180 blocked number one has some kind of
00:05:21.220 a nonce just like before there's some
00:05:23.020 data area too but then it has this
00:05:24.850 previous here is a bunch of zeros let's
00:05:27.700 let's roll forward so this is block
00:05:29.830 two and block 3 and 4 this block chain
00:05:33.550 has five blocks on it right the previous
00:05:36.580 here starts with 0000ae8 right is
00:05:40.990 this number
00:05:42.070 ae8 and then this previous you know b90 is this one
00:05:47.979 over here b90 so you can see that each
00:05:52.060 block points backwards to the one before
00:05:55.000 it
00:05:55.780 you remember that that first block over
00:05:58.570 here
00:05:59.290 there actually is no previous so it's
00:06:00.729 just a bunch of zeros it's actually just
00:06:02.410 a fake number
00:06:03.790 ok so just like we did before what
00:06:09.100 happens if I change some information
00:06:11.890 here right it's going to change the hash
00:06:14.979 of this block and it's going to
00:06:16.210 invalidate it right now let's try that
00:06:18.340 so i'm going to type pie again sure
00:06:20.440 enough that block is invalid
00:06:23.050 alright just as we assume but what would
00:06:25.630 happen i'm going to fix that now we'll
00:06:27.790 go back to something that work what
00:06:29.650 would happen if I changed something in
00:06:31.930 this block right it's going to change
00:06:34.810 this hash
00:06:36.169 but this hash gets copied up to this
00:06:39.259 previous so it's going to it's going to
00:06:42.199 change this one to right so it should
00:06:43.460 break both blocks so let me try typing
00:06:46.849 hi in there and sure enough all right so
00:06:50.629 we can go back as far as we want you
00:06:53.060 know to some point in the past and
00:06:55.879 break that block and it will break all
00:06:59.659 the blocks since then everything before
00:07:01.909 still green but this one is is red it's
00:07:05.900 so if i wanted to you know change
00:07:10.129 something in this this block chain I
00:07:14.120 could just go over to block number five
00:07:16.279 right here we could change it I'll put
00:07:18.110 hi and then we could remine it you
00:07:21.110 know and pick a different nonce will do
00:07:23.900 that right now and we could essentially
00:07:27.889 alter the chain so we've done it so that
00:07:30.199 we should be good down right all right
00:07:32.270 well what happens if i go back in time
00:07:34.339 to hear and I break it here now i have
00:07:38.749 to mine this block which will pick a
00:07:42.649 nonce that makes this block hash out to
00:07:45.889 four zeros if we can find one sometimes
00:07:49.250 it takes a while because it's gotta run
00:07:50.870 through a lot of there it is it found
00:07:52.399 one at a hundred and thirty-eight
00:07:53.569 thousand alright but this one is still
00:07:56.149 broken because although this one starts
00:07:58.639 with four zeros adding the four zeros with
00:08:02.330 different stuff up here still makes this
00:08:05.330 block hash out incorrectly so i also
00:08:07.279 have to mine this block
00:08:09.319 alright and that takes some amount of
00:08:12.379 time that one was a little bit quicker
00:08:13.669 and then i have to mine this block to
00:08:17.330 fix it
00:08:18.349 alright so what we're showing here is
00:08:21.080 that if i go and change this last block
00:08:24.860 all i have to do is remine this block if
00:08:28.550 I go way back in time to back here and I
00:08:31.639 make a change like that i'm going to
00:08:34.969 have to mind this one this one this one
00:08:37.099 and this one so the more blocks that go
00:08:40.698 by the more blocks in the past that we
00:08:43.519 are the harder and harder and harder it
00:08:46.310 is to make a change and so that
00:08:49.760 it's how a blockchain is going to resist
00:08:52.250 mutation resist change
00:08:54.890 ok so now you like like you know
00:09:01.250 identify if if i do this in this block
00:09:05.750 here you can see that I've changed it to
00:09:08.270 hi and I remine it blah blah blah how
00:09:11.210 would i know that my block chain has
00:09:15.260 been remined all right let's take a look
00:09:17.690 at that I'm gonna hit this little
00:09:18.830 distributed thing so now we have a just
00:09:22.490 distributed blockchain it looks exactly
00:09:24.590 like the last blockchain ok up to five
00:09:28.370 that but this is peer a the first peer
00:09:30.950 if you go down here you can see here is peer b
00:09:33.770 and it happens to have an exact copy of
00:09:37.880 the blockchain there's actually also
00:09:39.290 a peer c down here right this could go
00:09:41.150 on forever
00:09:41.990 there's many many peers out on the
00:09:44.180 internet and they all have a complete
00:09:45.830 copy of the blockchain so in this case
00:09:49.430 if i look at this hash it's 0000e4b
00:09:53.240 all right if I go down to this one I
00:09:57.290 notice it also has e4b if I go
00:10:00.860 down to this last one it has e4b so they
00:10:03.200 must be identical and i'm going to
00:10:05.210 demonstrate that by going here and
00:10:07.760 typing something i'll type hi again and
00:10:10.910 then i will remine this block
00:10:14.330 I've got some other number now let's put
00:10:16.100 some other number up here so i should be
00:10:19.880 able to mine this block
00:10:23.450 okay now all the chains are green right
00:10:26.210 they're all green
00:10:27.260 however this chain says the last hash is
00:10:32.180 e4b the bottom one says that too e4b
00:10:36.260 and this middle one here says 4cae
00:10:39.860 so I know just by glancing at this one
00:10:43.370 little hash that something is wrong in
00:10:46.220 this blockchain even though all of the
00:10:48.950 hashes start with four zeros I know that this one
00:10:52.070 is different and it's different because
00:10:54.290 i have two it's essentially two against
00:10:57.410 one we are a little democracy here right
00:10:59.600 this guy argues that it's
00:11:01.340 e4b this guy argues that it's
00:11:03.770 4ca and this one is e4b
00:11:07.760 so e4b wins so that's how a
00:11:11.210 completely distributed copy having a
00:11:14.930 copy on many different computers they
00:11:18.140 can all very quickly see if all of the
00:11:21.050 blocks are identical remember
00:11:22.370 blockchains can have you know 4
00:11:24.560 500,000 blocks very easily so rather
00:11:28.190 than checking through all of them all
00:11:29.780 you really have to do is look at the
00:11:31.250 hash of the most recent one and you can
00:11:34.220 see that if anything in the past
00:11:37.070 anything way back here was altered you
00:11:40.820 can tell by looking at this at the last
00:11:44.270 block in this in the chain you know it's
00:11:48.380 going to hash out to something that
00:11:49.490 doesn't start with four zeros and looks
00:11:52.130 very different from what the hashes on
00:11:54.830 the good chains are ok so that's a
00:11:57.800 blocking that's the entire thing there
00:12:00.230 is no more to it than that but it's kind
00:12:04.520 of not really useful because we don't
00:12:07.880 have some something in this data area
00:12:10.790 that means anything i keep typing my
00:12:12.890 name or hi and that's kind of that sort
00:12:15.050 of irrelevant information so what we
00:12:17.210 really want is a token so let's do a
00:12:20.360 token on our blockchain all right now
00:12:22.850 look at this so i have this token just
00:12:24.440 totally arbitrarily I'm calling these I
00:12:26.660 guess dollars right so we have
00:12:28.970 twenty-five dollars from Darcy to
00:12:31.310 Bingley four dollars and twenty-seven
00:12:34.730 cents go from Elizabeth to Jane you get the
00:12:36.800 idea it's basically there's all these
00:12:38.840 transactions that are happening and I've
00:12:41.480 just replaced the data with these
00:12:42.920 transactions and just like we saw before
00:12:45.860 you know so there's multiple blocks here
00:12:48.170 this one has more transact... it doesn't
00:12:49.610 matter how many transactions there are
00:12:51.440 there can be many or there can be few or
00:12:53.720 none if we keep going forward here just
00:12:56.990 like we saw before
00:12:59.150 if we go down and we notice we have all
00:13:01.520 these other copies of the same block
00:13:03.860 chain right so now here's where the
00:13:06.380 immutability is important if i change
00:13:09.140 something back here you'll notice that
00:13:12.260 this is you know a7fc blah blah blah
00:13:14.720 something it's something else
00:13:17.420 so it's something different than what's
00:13:20.209 down here so in in this way I mean it's
00:13:22.310 very important that if i were to go back
00:13:25.250 in time and change some value that we
00:13:30.410 would notice it's it's very important
00:13:33.589 with money that you don't lose track and
00:13:36.529 that's the whole point of using a
00:13:38.240 blockchain here this is a whole point of
00:13:40.129 resisting any kind of modifications you
00:13:44.180 know of things that have happened in the
00:13:45.920 past so that's the that's the reasoning
00:13:49.790 behind having using a blockchain to
00:13:53.149 remember tokens now I one thing I would
00:13:57.050 mention here is that we're not listing
00:14:01.819 you know Darcy has a hundred dollars and
00:14:06.319 he's giving 25 of it to Bingley the only
00:14:08.839 thing we're saying is Darcy gives 25 to
00:14:11.959 Bingley. We're not remembering a bank
00:14:13.939 account balance we're only remembering
00:14:15.920 money movements. So this begs the
00:14:20.779 question "does Darcy have $25?" Well we
00:14:25.160 have a problem here in this version
00:14:27.350 of the blockchain: we don't actually know
00:14:30.050 if Darcy has $25. So let's look at a
00:14:34.639 coinbase transaction. So if we look back
00:14:37.399 here a coin base we're going to add a
00:14:39.379 coinbase transaction to our blocks and
00:14:42.110 this is this is very similar to what
00:14:44.269 we've seen before but we're just adding
00:14:46.009 a coinbase at the top and what's that
00:14:47.329 that what that's saying is we're going to
00:14:49.550 invent a hundred dollars out of thin air
00:14:51.800 and give it to Anders and there's no
00:14:54.199 transactions in this block because
00:14:55.939 nobody had any money previous to this. In
00:14:59.420 the next block another hundred dollars
00:15:01.939 comes out of nowhere and goes to Anders i'm
00:15:03.589 a fan I love it right I'll take a
00:15:05.269 hundred bucks now we have some
00:15:06.889 transactions you can see that they're
00:15:08.629 all from Anders, they're all from me because
00:15:10.879 I'm the only one who has any money at
00:15:13.100 this point. So I'm sending 10 of my
00:15:16.129 dollars to Sophie. Do I have ten dollars?
00:15:19.129 Yeah, I do, I look back and I see that
00:15:20.809 this coinbase transaction has given me a
00:15:23.179 hundred so I have at least 10 and I can
00:15:25.459 send it on and you add all these up and
00:15:27.470 they don't go
00:15:28.130 over a hundred and it follows sort of a
00:15:30.470 basic rule of a currency that you
00:15:34.010 can't invent it out of thin air you can't
00:15:36.110 create money out of thin air you this
00:15:38.900 its dispersion is controlled so now if
00:15:43.070 we look at this block chain that we've
00:15:45.320 created and we zip forward in time and
00:15:49.130 we notice that we see that Jackson is
00:15:52.370 giving Alexa two dollars and so does
00:15:55.550 Jackson actually have two dollars to
00:15:58.310 give Alexa well we go back a block
00:16:00.260 before we see that Emily had gotten ten
00:16:02.300 dollars from Anders gave 10 to Jackson
00:16:06.440 and so Jackson does have the money so we
00:16:09.530 can just go backwards and and find that
00:16:12.650 out
00:16:13.250 that's actually one of the benefits of
00:16:15.200 having a previous here it's easy to go
00:16:18.170 backwards we we just look for the block
00:16:20.330 that looks like that that has that hash
00:16:22.520 and here it is right here right so you
00:16:24.440 points two blocks back in time and
00:16:26.450 allows us to trace the provenance of any
00:16:29.270 coin that we want
00:16:30.950 so that's a basic block chain and we're
00:16:33.590 running a currency on top of it and as
00:16:36.800 you know blockchains are there many
00:16:38.990 copies everybody has a copy of it so if
00:16:41.090 we mutate you know this and make it six
00:16:44.660 dollars these go invalid it does not
00:16:46.850 agree with with these block chains down
00:16:50.150 here these copies of the same block
00:16:52.190 chain down here so this resist tampering
00:16:56.090 which is what you want for a currency it
00:16:58.970 works very well for things that are
00:17:01.670 small and transactional like this
00:17:04.760 go ahead and fix that and they're
00:17:09.410 just a very efficient way to
00:17:12.380 handle agreement on what has happened in
00:17:17.119 the past as kind of this immutable
00:17:19.670 history that that goes down with
00:17:22.910 time so that's a basic block chain and a
00:17:26.689 token on it there were glossing over
00:17:28.369 some main points but if you dig into the
00:17:34.040 demo and and click through these things
00:17:36.080 and
00:17:37.030 play around with it you get a better and
00:17:38.830 better idea of how this works there will
00:17:41.650 be a part 2 where we go into a little
00:17:43.930 bit more detail about how the
00:17:46.210 transactions are created till then
```
