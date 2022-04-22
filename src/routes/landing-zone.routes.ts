import { Router } from 'express';
import { param } from 'express-validator';
import { performance } from 'perf_hooks';
import { EZone, ICoordinates } from 'src/types/landing-zone.types';
import { drone } from 'src/utils/constants';
import { getCoordinates } from 'src/utils/landing-zone.helpers';
import { validate } from 'src/utils/validation';

const router = Router();

router.get('/', (req, res) => {
  res.send(
    `${drone} needs to fly to find a landing zone, but is not sure which of the 10 landing zones has the correct coordinates.

Since SpaceY is on a tight budget, the rovers we sent in weren't exactly high quality. One of them shared garbage coordinates, while the other one malfunctioned in the middle.

After talking to NASA, however, we found that if all the coordinates shared by rover, R2, is includes in the list of coordinates shared by other rover, R1, then that landing zone is good to go.

But again, since we were on a tight budget, we didn't exactly hire the best engineers. Your task is to fix the isValidLandingZone function in the /landing-zone/:zone endpoint to make sure that the API correctly identifies valid landing zones.

The API accepts a landing zone (Z1, Z2, Z3,... Z10) and returns an object indicating the zone, whether that zone is valid, and the time it took to compute the result.`,
  );
});

router.get(
  '/:zone',
  validate(param('zone', 'Not a valid zone').isIn(Object.values(EZone))),
  async (req, res) => {
    const zone = req.params.zone as EZone;
    const coordinates = await getCoordinates(zone);

    const start = performance.now();

    const isValid = isValidLandingZone(coordinates);
    const end = performance.now();

    res.status(200).send({
      zone,
      isValid,
      elapsedTime: end - start,
    });
  },
);

// Function to update
export const isValidLandingZone = ({ R1: arr1, R2: arr2 }: ICoordinates) => {
  const decreasingSortF = (a: number, b: number) => b - a;
  const sortedR1 = arr1.sort(decreasingSortF);
  const sortedR2 = arr2.sort(decreasingSortF);

  let r1pointer = 0;
  for (let i = 0; i < sortedR2.length; i++) {
    if (sortedR2[i] > sortedR1[r1pointer]) {
      // in this condition there will be no sortedR2[i] in R1 arr, since arrays are sorted
      return false;
    }

    if (sortedR2[i] < sortedR1[r1pointer]) {
      // in case there are values in between that are not in R2
      while (
        sortedR1[r1pointer] > sortedR2[i] &&
        r1pointer < sortedR1.length - 1
      ) {
        r1pointer++;
      }

      // worst case if all nums in r1 are greater then the current num in r2
      // see Z11 for reference
      if (
        r1pointer === sortedR1.length - 1 &&
        sortedR1[r1pointer] > sortedR2[i]
      ) {
        return false;
      }

      // same as first if statement
      if (sortedR2[i] > sortedR1[r1pointer]) {
        return false;
      }
      r1pointer--;
    }
    r1pointer++;
  }

  return true;
};

export default router;
