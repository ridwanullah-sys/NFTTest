import { BigNumber } from "bignumber.js";
import { isHexString } from "@particle-network/auth";
import numbro from "numbro";

export function fromSunFormat(amount, mantissa = 6) {
  const bn = new BigNumber(amount, isHexString(amount) ? 16 : 10);
  const value = bn.div(new BigNumber(1000_000)).toString(10);
  return numbro(value).format({
    thousandSeparated: true,
    trimMantissa: true,
    mantissa: mantissa,
  });
}
