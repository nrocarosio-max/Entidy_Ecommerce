import PropTypes from 'prop-types';
function MenuItem({ data, onClick }: any) {
        const classes = `w-full justify-start font-bold-[600] ${data.separate ? 'border-t' : ''}`
        return (
                <button className={classes} onClick={onClick}>
                        {data.title}
                </button>
        );
}

MenuItem.propTypes = {
        data: PropTypes.object.isRequired,
        onClick: PropTypes.func,
};

export default MenuItem;
