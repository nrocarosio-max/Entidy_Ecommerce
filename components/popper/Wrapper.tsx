import PropTypes from 'prop-types';


function Wrapper({ children, className }: any) {
    return <div className={` ${className}`}>{children}</div>;
}

Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Wrapper;
