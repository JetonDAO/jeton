module zk_deck::groth16 {
    use aptos_std::bls12381_algebra::{Fr, FormatFrMsb, G1, FormatG1Uncompr, G2, FormatG2Uncompr, Gt};
    use aptos_std::crypto_algebra;
    use aptos_std::crypto_algebra::Element;

    struct VerificationKey has drop {
        alpha: Element<G1>,
        beta: Element<G2>,
        gamma: Element<G2>,
        delta: Element<G2>,
        ic: vector<Element<G1>>,
    }

    package fun new_verification_key(
        alpha_bytes: &vector<u8>,
        beta_bytes: &vector<u8>,
        gamma_bytes: &vector<u8>,
        delta_bytes: &vector<u8>,
        ic_bytes: &vector<vector<u8>>,
    ): VerificationKey {
        let alpha = deserialize_g1(alpha_bytes);
        let beta = deserialize_g2(beta_bytes);
        let gamma = deserialize_g2(gamma_bytes);
        let delta = deserialize_g2(delta_bytes);
        let ic = ic_bytes.map_ref(|b| deserialize_g1(b));
        VerificationKey{ alpha, beta, gamma, delta, ic }
    }

    package fun verify(
        key: &VerificationKey,
        public_signals: &vector<Element<Fr>>,
        proof_bytes: &vector<u8>,
    ): bool {
        let scalars = vector[crypto_algebra::from_u64<Fr>(1)];
        scalars.append(*public_signals);
        let sum = crypto_algebra::multi_scalar_mul(&key.ic, &scalars);

        let proof_a = deserialize_g1(&proof_bytes.slice(0, 96));
        let proof_b = deserialize_g2(&proof_bytes.slice(96, 288));
        let proof_c = deserialize_g1(&proof_bytes.slice(288, 384));

        let left = crypto_algebra::pairing(&proof_a, &proof_b);
        let right = crypto_algebra::zero<Gt>();
        let right = crypto_algebra::add(
            &right,
            &crypto_algebra::pairing(&key.alpha, &key.beta),
        );
        let right = crypto_algebra::add(
            &right,
            &crypto_algebra::pairing(&sum, &key.gamma),
        );
        let right = crypto_algebra::add(
            &right,
            &crypto_algebra::pairing(&proof_c, &key.delta),
        );
        crypto_algebra::eq(&left, &right)
    }

    package fun deserialize_fr(bytes: &vector<u8>): Element<Fr> {
        crypto_algebra::deserialize<Fr, FormatFrMsb>(bytes).destroy_some()
    }

    package fun deserialize_g1(bytes: &vector<u8>): Element<G1> {
        crypto_algebra::deserialize<G1, FormatG1Uncompr>(bytes).destroy_some()
    }

    package fun deserialize_g2(bytes: &vector<u8>): Element<G2> {
        crypto_algebra::deserialize<G2, FormatG2Uncompr>(bytes).destroy_some()
    }

    #[test]
    fun test_verify() {
        use std::vector;

        let public_signals_bytes = x"624d163544a482d8eb1b0916bda5584c0bfc8b44e5ddd95b08e3ce6540bb322435785d5d542e0178951dec194319290b2fd4f7d16fe8fc57da0abc18620bfc371262f95484b4e53c820707481b1957cd8fde75984efdcb0adf172e7b4f83193369c601d725626b13df19e36f157bcef5a840a5be9aeeaa19f188dd00c5217f5d51007fe659d25e8cef7fd590adf22d027a0a5cd1fef54882fdd5e47fa738d041003b59acd380b9b586045881fa65587ea04e496e33b01282906223f6bd01cd72";
        let proof = x"0a92d9e9e5db084e53e8254ecef8d79cd9c5eecae7cc9857655ec9daeb9d8149e366cc5085f9f1914e353a95caab88a014242cf5a2aadeb7685b3edcdeddb196eb6a61fa10c0824e266a6356beb11e0b35cf5dde7d82bdbb59ff58bdeb0c998c0d6aec7fb1fd7fbbcc315b54a25ae565abf3082c8961dda48782c6b3340588b573565130c8784a7b825b0ae0acf95b3907bdb0e98b45c4e17739289c02b7e3eac88e3c850cd6f29fd11ad38753871c166be0b02327a68a247b182e9ed3a58fa1100db3f6e0b062b74366d53486b66ac5641b8903e1ec0afe407eba052bde950df5b658da4f748993e3e00aa668a2a885067df724838fe04543d3b82804c9bf14c7300aa6e74faafbf007c7886e5916afc130033e1d6e8a553eee1600d0372b1b13384fb9711a7ebebfe69c7d389c5aca532ed11064581e1cc891d6731d83923b921319cc5b54680e5c4685e908552f740eaae565e8694d6c5cb66945d3bc38036e3c8ad1201eac37292c1f1366d13a2654d4835142fd54063fad36edee329fe5";
        let key = new_verification_key(
            &x"0a24cd207b7c693780f5316253254b86e5d4890d61560e6ec97d468ca8ee577fca3403add4a7b565fc989bcee7f7d2871809d6adb77b1941624674f37d75e0f271728e0621e974d00ba973128b34442bd5fd0a29f60434f2bb2dd734d06723cd",
            &x"0c5baaf64f69e4cc71a1bea4e5c452064ca80502da0fa6a12fc5e89874788b013a3fe72db2207c7b5ed8411263cbb3730a8dc50121099d7eb68a8e881d05b7dd4262c0545ef731948216db23a4bc3a8c049c2ab367527c5846870bdb12595a7c109c614bae49c5f2f941a4b37b6fd5edc24a667982ea05bad62773b39225b1f1bc032efcd665fa4f0e85fc64528835320c428b33e658d225fa7025a8d75c0b7daca386813dbf25881d8266f133b8a7c37a33bd79a39de16165c2fc4ecdb64de5",
            &x"13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb80606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79be0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b82801",
            &x"04bb07b973189d8a95d6d51018bd010ad75eb8a74d16cc8d36ddbe2e91a2b7945d4a838bcddd23cd4832cac1b6562eb4047dd9a77f8e85fcf8a01385a23e8b663eaf36da20fff2eafa5c4df940876eacc1b4a963465d5f00dc5c0b635f21e1cb0cca8b84b6e38193c2906a2b8a7fb35ba725fa43294a31736824156e4cfde01862e799471979dd7c32639e1faf2374cf15f96717357e13564536826929189b5a130af5087db9f89577f42c1d6670d177014fd9fff9f10d6cdcaec33893c06d7f",
            &vector[
                x"18349ab52eb25fcd2bf2708d17894caa0fc918d163f02c10dfe7faccce6f8ddd8021b92d4a45452289337fd4d9ff4e6a00729d776e0d241c39d4753cffb23d5bfb668c2e87d423f569f8f3a0d102cfc68abf31b1dda811484c43c2658e1f226c",
                x"16450f21387889380ccdc5395732fa0054d5611483d5af5d4595fa087707a8c6cb3bbea4ccd90adef5af460f9693c8251800ae3b65338720b9c2c9a3968142b3c18938bc1f7299e98aba079ff275fe965d49c06495e53aa24848f909133d295e",
                x"1485a5a567dd1ff1e97945c903efc3821aaad1d1cb52d23d3ae69e10028a6758e58cdc087cf491fc2eb47a586b4db4c506367fc70edf145903137bfb8b569c8826f8c950e6f646747dd69af7329f269d16037f3536cf2500f1abec7f92f1b5fd",
                x"084baef43b298c744a0c870fe66a555a1aed1c5b3a78fc2f276e88d13b0626125f89f41e433ca7f412f8949cac6ea7f215a4e4139e621bad1596dd00f5d8f615876876932fafa4b060ce4691936766db61f14ea9679b90deaadef27a37cf2912",
                x"1523fdb7f05e807d0afd47d7b9a74a2a92419569f0c54267e74a9e9b2642fb547c4abb2274b3e172d33f420a3d269d9b0a8994278c6f72a907c0f2519a485577c0910be09a70e7011f342bee64ccf15ec63891e875d5de10f780e435669c545b",
                x"1147e59ee8bbab39a8b0917c1b97f347a6b4c1cd828f1035a85df274de3898229e20579382019987cbb1d6e3ec0d3dc50746b6bb80443f7c8f296f35ed822baf95f042cb21528987a0a0717b791f0f072b95429840c930e639f57ebaf61f9c4b",
                x"19e8f017ad72b87ad588bcc1c1eda97033b2635163393d696d419efbe517ba0b6882d8bfd1741f216ef345f6c8b054b3084ac9d62f602f0f220b7735f0d3bb9ef1f115f044e94ffa1a0ab610d389c9ba37cb3f72c97c73a386292546dad0c9cc",
            ],
        );
        let num_signals = public_signals_bytes.length() / 32;
        let public_signals = vector::range(0, num_signals).map(
            |i| deserialize_fr(&public_signals_bytes.slice(32*i, 32*i+32))
        );
        assert!(verify(&key, &public_signals, &proof));
    }
}