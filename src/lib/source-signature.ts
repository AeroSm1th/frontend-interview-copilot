import type { SourceSignature } from "@/types/resume";

const SOURCE_SIGNATURE_VERSION = 1;
const SOURCE_SIGNATURE_CHECKSUM_MOD = 2147483647;

export function normalizeTextForSourceSignature(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function computeChecksum(value: string) {
  let checksum = 0;

  for (let index = 0; index < value.length; index += 1) {
    checksum =
      (checksum + value.charCodeAt(index) * (index + 1)) %
      SOURCE_SIGNATURE_CHECKSUM_MOD;
  }

  return checksum;
}

export function createSourceSignature(value: string): SourceSignature {
  const normalizedText = normalizeTextForSourceSignature(value);

  return {
    version: SOURCE_SIGNATURE_VERSION,
    normalizedLength: normalizedText.length,
    checksum: computeChecksum(normalizedText),
  };
}

export function areSourceSignaturesEqual(
  left: SourceSignature | null | undefined,
  right: SourceSignature | null | undefined,
) {
  if (!left || !right) {
    return false;
  }

  return (
    left.version === right.version &&
    left.normalizedLength === right.normalizedLength &&
    left.checksum === right.checksum
  );
}
