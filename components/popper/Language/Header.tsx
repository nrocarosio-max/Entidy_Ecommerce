import PropTypes from 'prop-types';
import { FaChevronLeft } from "react-icons/fa"


function Header({ title, onBack }: any) {
        return (
                <header className="w-full flex items-center pl-4 gap-5 mb-3 font-bold">
                        <button className="" onClick={onBack}>
                                <FaChevronLeft />
                        </button>
                        <h4 className="">{title}</h4>
                </header>
        );
}

Header.propTypes = {
        title: PropTypes.string.isRequired,
        onBack: PropTypes.func.isRequired,
};

export default Header;
