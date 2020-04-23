import { Options as requestOptions } from 'request'
import Plugin, { tools } from '../../plugin'

class Judge extends Plugin {
  constructor() {
    super()
  }
  public name = '风纪委投票'
  public description = '风纪委自动投票'
  public version = '0.0.1'
  public author = 'catbule'
  /**
   * 任务表
   *
   * @private
   * @type {Map<string, boolean>}
   * @memberof Judge
   */
  private _judgeList: Map<string, boolean> = new Map()
  public async load({ defaultOptions, whiteList }: { defaultOptions: options, whiteList: Set<string> }) {
    // 兑换硬币
    defaultOptions.newUserData['judge'] = false
    defaultOptions.info['judge'] = {
      description: '风纪委投票',
      tip: '风纪委自动投票',
      type: 'boolean'
    }
    whiteList.add('judge')
    this.loaded = true
  }
  public async start({ users }: { users: Map<string, User> }) {
    this._judge(users)
  }
  public async loop({ cstMin, cstHour, cstString, users }: { cstMin: number, cstHour: number, cstString: string, users: Map<string, User> }) {
    // 每天00:10刷新任务
    if (cstString === '00:10') this._judgeList.clear()
    // 每半点做任务
    if (cstMin === 30 && cstHour % 1 === 0) this._judge(users)
  }
  /**
   * 风纪委投票
   *
   * @private
   * @memberof Judge
   */
  private _judge(users: Map<string, User>) {
    new Number(this._caseObtain(users))
  }

  // 案件获取
  private _caseObtain(users: Map<string, User>){
    users.forEach(async (user) => {
    const csrf_token = tools.getCookie(user.jar, 'bili_jct')
    const getjudge: requestOptions = {
        method: 'POST',
        uri: `http://api.bilibili.com/x/credit/jury/caseObtain`,
        body: `jsonp=jsonp&csrf_token=${csrf_token}&csrf=${csrf_token}`,
        jar: user.jar,
        json: true,
        headers: user.headers
      }
      const caseObtain = await tools.XHR<caseObtain>(getjudge, 'PC')
      //tools.Log(caseObtain)
      if (caseObtain !== undefined && caseObtain.body.code === 25005) {
        tools.Log(user.nickname, '案件获取', caseObtain.body.message)
        return false
      }
      if (caseObtain !== undefined && caseObtain.body.code) {
        tools.Log(user.nickname, '没有获取到案件~', caseObtain.body)
        return false
      }
      else {
        tools.Log(user.nickname, '获取到案件', caseObtain?.body.data.id)
        const juryVote: requestOptions = {
          method: 'POST',
          uri: `http://api.bilibili.com/x/credit/jury/vote`,
          body: `jsonp=jsonp&cid=${caseObtain?.body.data.id}&vote=4&content=&likes=&hates=&attr=1&csrf=${csrf_token}`,
          jar: user.jar,
          json: true,
          headers: user.headers
        }
        const Vote = await tools.XHR<Vote>(juryVote, 'PC')
        //tools.Log(Vote)
        if (Vote !== undefined && Vote.body.code) {
          tools.Log(user.nickname, '案件', caseObtain?.body.data.id, '投票失败', Vote.body)
        }
        else{
          tools.Log(user.nickname, '案件', caseObtain?.body.data.id, '投票成功', Vote?.body)
        }
        return true
      }
   })
  }
}


 /**
 * 案件获取返回
 *
 * @interface caseObtain
 */
interface caseObtain {
  code: number
  message: string
  ttl: number
  data: caseObtaindata
}
interface caseObtaindata {
  id:number
}

 /**
 * 案件投票返回
 *
 * @interface Vote
 */
interface Vote {
  code: number
  message: string
  ttl: number
}
export default new Judge()
