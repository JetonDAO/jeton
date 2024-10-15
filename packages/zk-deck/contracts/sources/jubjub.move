module zk_deck::jubjub {
    use aptos_std::bls12381_algebra::{Fr, FormatFrMsb};
    use aptos_std::crypto_algebra;
    use aptos_std::crypto_algebra::Element;
    use std::option;
    use std::vector;

    struct Point has drop, copy {
        x: Element<Fr>,
        y: Element<Fr>,
    }

    package fun to_element_vector(self: &Point): vector<Element<Fr>> {
        vector[self.x, self.y]
    }

    struct CurveParams has drop {
        edwards_a: Element<Fr>,
        edwards_d: Element<Fr>,
    }

    package fun get_curve_params(): CurveParams {
        let edwards_a = option::destroy_some(
            crypto_algebra::deserialize<Fr, FormatFrMsb>(
                &x"73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000000",
            )
        );
        let edwards_d = option::destroy_some(
            crypto_algebra::deserialize<Fr, FormatFrMsb>(
                &x"2a9318e74bfa2b48f5fd9207e6bd7fd4292d7f6d37579d2601065fd6d6343eb1",
            )
        );
        CurveParams { edwards_a, edwards_d }
    }

    package fun serialize(point: &Point): vector<u8> {
        let bytes = vector::empty<u8>();
        vector::append(&mut bytes, crypto_algebra::serialize<Fr, FormatFrMsb>(&point.x));
        vector::append(&mut bytes, crypto_algebra::serialize<Fr,FormatFrMsb>(&point.y));
        bytes
    }

    package fun deserialize(bytes: &vector<u8>): Point {
        let maybe_x = crypto_algebra::deserialize<Fr, FormatFrMsb>(
            &vector::slice(bytes, 0, 32),
        );
        let maybe_y = crypto_algebra::deserialize<Fr, FormatFrMsb>(
            &vector::slice(bytes, 32, 64),
        );
        Point {
            x: option::destroy_some(maybe_x),
            y: option::destroy_some(maybe_y),
        }
    }

    package fun zero(): Point {
        Point {
            x: crypto_algebra::zero<Fr>(),
            y: crypto_algebra::one<Fr>(),
        }
    }

    package fun one(): Point {
        deserialize(
            &x"11dafe5d23e1218086a365b99fbf3d3be72f6afd7d1f72623e6b071492d1122b1d523cf1ddab1a1793132e78c866c0c33e26ba5cc220fed7cc3f870e59d292aa"
        )
    }

    package fun in_curve(params: &CurveParams, point: &Point): bool {
        let x2 = crypto_algebra::sqr<Fr>(&point.x);
        let y2 = crypto_algebra::sqr<Fr>(&point.y);
        let ax2 = crypto_algebra::mul<Fr>(&params.edwards_a, &x2);
        let x2y2 = crypto_algebra::mul<Fr>(&x2, &y2);
        let dx2y2 = crypto_algebra::mul<Fr>(&params.edwards_d, &x2y2);
        let one = crypto_algebra::one<Fr>();
        let left = crypto_algebra::add<Fr>(&ax2, &y2);
        let right = crypto_algebra::add<Fr>(&one, &dx2y2);
        crypto_algebra::eq<Fr>(&left, &right)
    }

    package fun eq(point1: &Point, point2: &Point): bool {
        crypto_algebra::eq(&point1.x, &point2.x) && crypto_algebra::eq(&point1.y, &point2.y)
    }

    package fun neg(point: &Point): Point {
        Point {
            x: crypto_algebra::neg<Fr>(&point.x),
            y: point.y,
        }
    }

    package fun add(params: &CurveParams, point1: &Point, point2: &Point): Point {
        let one = crypto_algebra::one<Fr>();

        let beta = crypto_algebra::mul(&point1.x, &point2.y);
        let gamma = crypto_algebra::mul(&point1.y, &point2.x);
        let delta = crypto_algebra::mul(
            &crypto_algebra::sub(
                &point1.y,
                &crypto_algebra::mul(&params.edwards_a, &point1.x),
            ),
            &crypto_algebra::add(&point2.x, &point2.y),
        );
        let tau = crypto_algebra::mul(&beta, &gamma);
        let dtau = crypto_algebra::mul(&params.edwards_d, &tau);

        let maybe_x = crypto_algebra::div(
            &crypto_algebra::add(&beta, &gamma),
            &crypto_algebra::add(&one, &dtau),
        );
        let maybe_y = crypto_algebra::div(
            &crypto_algebra::add(
                &delta,
                &crypto_algebra::sub(
                    &crypto_algebra::mul(&params.edwards_a, &beta),
                    &gamma,
                ),
            ),
            &crypto_algebra::sub(&one, &dtau),
        );
        Point {
            x: option::destroy_some(maybe_x),
            y: option::destroy_some(maybe_y),
        }
    }

    package fun sub(params: &CurveParams, point1: &Point, point2: &Point): Point {
        add(
            params,
            point1,
            &neg(point2),
        )
    }

    #[test]
    fun test_add_point_with_neg_should_be_zero() {
        let params = get_curve_params();
        let zero = zero();
        let one = one();
        let point1 = add(&params, &one, &one);
        assert!(in_curve(&params, &point1));
        let point2 = neg(&point1);
        assert!(in_curve(&params, &point2));
        let point3 = add(&params, &point1, &point2);
        assert!(eq(&point3, &zero));
    }
}