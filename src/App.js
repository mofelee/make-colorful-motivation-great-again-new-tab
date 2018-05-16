import React, {PureComponent, Component} from 'react';

import ReactAnimationFrame from 'react-animation-frame';
import InfiniteCalendar from 'react-infinite-calendar';
import 'react-infinite-calendar/styles.css';

import setYear from 'date-fns/set_year'
import differenceInYears from 'date-fns/difference_in_years';
import differenceInMilliseconds from 'date-fns/difference_in_milliseconds';

/**
 * 给入时间，以分数形式计算出此时间到当前时间的差值
 */
function calculateAge(d){
  const now = Date.now();
  const year = differenceInYears(now, d);
  const diffInMs = differenceInMilliseconds(now, setYear(d, d.getFullYear() + year));
  const diffCurrYearInMs = differenceInMilliseconds(setYear(d, d.getFullYear() + year + 1), setYear(d, d.getFullYear() + year));
  return year + diffInMs / diffCurrYearInMs;
}

/**
 * 计算小数1到7位代表的颜色
 */
function calculateColor(t){
  return t.toFixed(10).split('.')[1].slice(1, 7);
}

/**
 * 计数器组件
 */
const Timer = ReactAnimationFrame(class extends PureComponent {
  constructor(props){
    super(props);

    this.state = {
      t: '',
      color: '999999',
    }
  }

  // 每一帧计算出的
  onAnimationFrame(){
    const t = calculateAge(this.props.date);

    this.setState({
      t: t.toFixed(10),
      color: calculateColor(t)
    })
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.color !== this.state.color){
      this.props.onColorUpdate && this.props.onColorUpdate(this.state.color);
    }
  }

  render(){
    const { t } = this.state;
    const [x='', y=''] = t.split('.');

    return (
      <div style={{
        color: 'white',
        fontFamily: 'monospace',
      }}>
        <span style={{fontSize: 100}}>{x}</span>
        <span style={{fontSize: 50}}>.{y.slice(0, 1)}<span style={{textDecoration: 'underline'}}>{y.slice(1, 7)}</span>{y.slice(7)}</span>
      </div>
    )
  }
});

/**
 * 日期选择组件
 *
 * 之所以要抽出来是为了防止更新颜色的时候触发了日期选择组件的重绘
 */
class Calendar extends Component {
  shouldComponentUpdate(prevProps){
    // 防止颜色变化触发当前组件的重新渲染
    return prevProps.selected.getTime() !== this.props.selected.getTime();
  }

  render(){
    const {selected, onSelect} = this.props;

    return (
      <InfiniteCalendar
        display="years"
        min={new Date(1920, 0, 1)}
        minDate={new Date(1920, 0, 1)}
        max={new Date()}
        selected={selected}
        onSelect={onSelect}
        locale={{
          headerFormat: 'MMMM D',
        }}
      />
    )
  }
}

const BIRTHDAY_KEY = 'motivation_birthday'; // localStorage 中保存日期使用的 key
class Motivation extends PureComponent {
  constructor(props){
    super(props);

    this.state = {
      date: new Date(),
      showCalendar: false,
      color: '000000'
    }
  }

  componentDidMount(){
    // 从 localStorage 中获取之前设置的时间
    try {
      const birthdayString = localStorage.getItem(BIRTHDAY_KEY)
      const d = JSON.parse(birthdayString);

      if(d){
        this.setState({
          date:  new Date(d),
          showCalendar: false,
          color: calculateColor(calculateAge(this.state.date))
        })
      } else {
        this.setState({
          showCalendar: true,
        })
      }
    } catch(e){
      this.setState({
        showCalendar: true,
      });
    }
  }

  componentDidUpdate(prevProps, prevState){
    // 更新生日
    if(prevState.date.getTime() !== this.state.date.getTime()){
      const d = JSON.stringify(this.state.date)

      localStorage.setItem(BIRTHDAY_KEY, d)
    }
  }

  render(){
    const { date, color, showCalendar } = this.state;

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: `#${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{paddingBottom: '26vh'}} >
          <div style={{cursor: 'pointer', userSelect: 'none'}} onClick={()=>this.setState({showCalendar: !this.state.showCalendar})}>
            <Timer date={date} onColorUpdate={color=>this.setState({color: color})}/>
            {showCalendar &&
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar selected={date} onSelect={date=>this.setState({date: date})} />
              </div>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default Motivation;
