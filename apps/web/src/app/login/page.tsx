import GoogleAuth from "../@modal/(.)login/GoogleAuth";

export const runtime = "edge";

export default function Login() {
  return (
    <div className="text-center mt-[50vh]">
      <GoogleAuth />
    </div>
  );
}
