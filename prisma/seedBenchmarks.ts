import { PrismaClient, Sex } from "@prisma/client";

const prisma = new PrismaClient();

const VERSION = "v1.0";

// Provisional boys' benchmark bands — spec section 8.
// minBenchmark = the "best" edge, maxBenchmark = the "worst" edge,
// regardless of which direction is numerically higher — the scoring
// formula in section 10 picks the right subtraction order based on
// lowerIsBetter, so we just record the two band edges as given.
type BandRow = {
  testCode: string;
  lowerIsBetter: boolean;
  bands: Record<"U11" | "U13" | "U15" | "U17", [number, number]>; // [best, worst]
};

const BOYS_BANDS: BandRow[] = [
  {
    testCode: "10M_SPRINT",
    lowerIsBetter: true,
    bands: {
      U11: [2.05, 2.40],
      U13: [1.85, 2.15],
      U15: [1.75, 2.00],
      U17: [1.65, 1.90],
    },
  },
  {
    testCode: "30M_SPRINT",
    lowerIsBetter: true,
    bands: {
      U11: [5.0, 5.6],
      U13: [4.4, 4.9],
      U15: [4.1, 4.6],
      U17: [3.9, 4.4],
    },
  },
  {
    testCode: "505_COD",
    lowerIsBetter: true,
    bands: {
      U11: [2.75, 3.20],
      U13: [2.45, 2.85],
      U15: [2.25, 2.60],
      U17: [2.15, 2.50],
    },
  },
  {
    testCode: "CMJ",
    lowerIsBetter: false,
    bands: {
      U11: [20, 28],
      U13: [23, 32],
      U15: [27, 38],
      U17: [30, 42],
    },
  },
  {
    testCode: "YOYO_IR1",
    lowerIsBetter: false,
    bands: {
      U11: [600, 1000],
      U13: [800, 1300],
      U15: [1000, 1800],
      U17: [1400, 2300],
    },
  },
  {
    testCode: "RSA_6X20",
    lowerIsBetter: true,
    bands: {
      U11: [4.0, 4.6],
      U13: [3.6, 4.1],
      U15: [3.3, 3.8],
      U17: [3.1, 3.6],
    },
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const row of BOYS_BANDS) {
    for (const [ageGroup, [best, worst]] of Object.entries(row.bands) as [
      "U11" | "U13" | "U15" | "U17",
      [number, number]
    ][]) {
      // Store min/max as the literal numeric min/max of the two edges,
      // so the scoring formulas (which subtract max-of-worst minus min-of-best,
      // or player-minus-min depending on direction) always have a
      // well-defined numeric range regardless of lowerIsBetter.
      const minBenchmark = Math.min(best, worst);
      const maxBenchmark = Math.max(best, worst);

      const result = await prisma.benchmarkConfig.upsert({
        where: {
          testCode_ageGroup_sex_version: {
            testCode: row.testCode,
            ageGroup,
            sex: Sex.MALE,
            version: VERSION,
          },
        },
        update: {
          minBenchmark,
          maxBenchmark,
          lowerIsBetter: row.lowerIsBetter,
        },
        create: {
          testCode: row.testCode,
          ageGroup,
          sex: Sex.MALE,
          version: VERSION,
          minBenchmark,
          maxBenchmark,
          lowerIsBetter: row.lowerIsBetter,
        },
      });

      // Prisma's upsert doesn't tell us directly which branch ran, so we
      // just count them together for the summary log below.
      void result;
      created++;
    }
  }

  console.log(`Seeded/updated ${created} benchmark rows (boys, version ${VERSION}).`);
  console.log(
    "Note: girls' benchmark bands are not yet defined in the spec (section 9) — " +
      "add a parallel BOYS_BANDS-style table under Sex.FEMALE once those figures exist."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });