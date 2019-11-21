import * as React from "react";
import Picker from "./picker";

export default class DimensionPicker extends React.Component {
  props: {
    label: string;
    max: number;
    min: number;
    initialValue: number;
    onChange(value: number);
  };

  state: { value: number };

  constructor(props) {
    super(props);
    this.state = { value: props.initialValue || props.min };
  }

  render() {
    return (
      <Picker
        initialValue={this.props.initialValue}
        label={this.props.label}
        options={this.options()}
        onChange={this.props.onChange}
      ></Picker>
    );
  }

  options() {
    const { min, max } = this.props;
    const options = [];
    for (let d = min; d <= max; d++) {
      options.push({ value: d, text: d.toString() });
    }
    return options;
  }
}
