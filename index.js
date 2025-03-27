// 定义日程数据
import schedules from './data'

import {Scanning} from './scanning'

console.log('schedules', schedules)
console.log('Scanning', Scanning)


try {
  const { conflictPeriods, freePeriods } = new Scanning(schedules, false);
  console.log("冲突时间段", conflictPeriods);
  console.log("不冲突时间段", freePeriods);
} catch (err) {
  console.log("err", err);
}
