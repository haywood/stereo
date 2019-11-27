import * as React from "react";
import styled from "styled-components";

export default class Picker extends React.Component {
  props: {
    label: string;
    initialValue: any;
    options: { value: any; text: string }[];
    onChange(value: any);
  };

  state: { value: any };

  constructor(props) {
    super(props);
    this.state = { value: props.initialValue };
  }

  render() {
    return (
      <Component>
        <label>{this.props.label}</label>
        <select value={this.state.value} onChange={this.onChange}>
          {this.renderOptions()}
        </select>
      </Component>
    );
  }

  onChange = event => {
    const { value } = event.target;
    this.setState({ value }, () => this.props.onChange(value));
  };

  renderOptions() {
    return this.props.options.map(o => (
      <option key={o.value} value={o.value}>
        {o.text}
      </option>
    ));
  }
}

const Component = styled.div`
  select {
    padding: 8px;
  }
`;
